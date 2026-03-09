import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

type OpenCVProps = {
    imageUri: string;
    referenceUri: string;
    onValidationComplete: (isValid: boolean, details?: any) => void;
    onError: (error: string) => void;
};

export default function OpenCVValidator({ imageUri, referenceUri, onValidationComplete, onError }: OpenCVProps) {
    const webviewRef = useRef<WebView>(null);
    const [isOpencvLoaded, setIsOpencvLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const processImages = async () => {
        try {
            setIsProcessing(true);
            const capturedBase64 = await new FileSystem.File(imageUri).base64();
            const referenceBase64 = await new FileSystem.File(referenceUri).base64();

            webviewRef.current?.injectJavaScript(`
        if (window.processImages) {
          window.processImages("data:image/jpeg;base64," + "${capturedBase64}", "data:image/jpeg;base64," + "${referenceBase64}");
        }
        true;
      `);
        } catch (err: any) {
            onError('Error reading files: ' + err.message);
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        if (isOpencvLoaded && imageUri && referenceUri && !isProcessing) {
            processImages();
        }
    }, [isOpencvLoaded, imageUri, referenceUri]);

    const onMessage = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'READY') {
                setIsOpencvLoaded(true);
            } else if (data.type === 'RESULT') {
                setIsProcessing(false);
                onValidationComplete(data.isValid, data);
            } else if (data.type === 'ERROR') {
                setIsProcessing(false);
                onError('OpenCV Error: ' + data.message);
            }
        } catch (err: any) {
            onError('Bridge Error: ' + err.message);
        }
    };

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://docs.opencv.org/4.8.0/opencv.js" type="text/javascript"></script>
    </head>
    <body>
      <script>
        // Wait until OpenCV is fully initialized
        const initInterval = setInterval(() => {
          if (typeof cv !== 'undefined' && cv.Mat) {
            clearInterval(initInterval);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
          }
        }, 500);

        window.processImages = function(capturedSrc, referenceSrc) {
          try {
            let imgElement = new Image();
            let refElement = new Image();
            
            let loadedCount = 0;
            const checkLoad = () => {
               loadedCount++;
               if (loadedCount === 2) analyze();
            };
            imgElement.onload = checkLoad;
            refElement.onload = checkLoad;

            imgElement.onerror = () => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Failed to load captured image element' }));
            refElement.onerror = () => window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Failed to load reference image element' }));
            
            imgElement.src = capturedSrc;
            refElement.src = referenceSrc;

            function analyze() {
              let matCaptured = null;
              let matRef = null;
              let edgesCaptured = null;
              let contoursCaptured = null;
              let hierarchyCaptured = null;
              let kpCaptured = null;
              let desCaptured = null;
              let kpRef = null;
              let desRef = null;
              let matches = null;
              let orb = null;
              let bf = null;

              try {
                matCaptured = cv.imread(imgElement);
                matRef = cv.imread(refElement);

                // --- FEATURE EXTRACTION & STRUCTURAL ANALYSIS ---
                // Convert to grayscale
                cv.cvtColor(matCaptured, matCaptured, cv.COLOR_RGBA2GRAY, 0);
                cv.cvtColor(matRef, matRef, cv.COLOR_RGBA2GRAY, 0);

                // Apply Edge Detection to find table boundaries
                edgesCaptured = new cv.Mat();
                cv.Canny(matCaptured, edgesCaptured, 50, 150, 3, false);

                // Find contours to identify the grid structure
                contoursCaptured = new cv.MatVector();
                hierarchyCaptured = new cv.Mat();
                cv.findContours(edgesCaptured, contoursCaptured, hierarchyCaptured, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
                
                let rectCount = 0;
                for (let i = 0; i < contoursCaptured.size(); ++i) {
                    let cnt = contoursCaptured.get(i);
                    let approx = new cv.Mat();
                    let peri = cv.arcLength(cnt, true);
                    cv.approxPolyDP(cnt, approx, 0.04 * peri, true);
                    
                    // Count rectangular structures (representing table cells/boxes)
                    if (approx.rows === 4) {
                        let area = cv.contourArea(approx);
                        if (area > 1000) { // arbitrary threshold to ignore noise
                            rectCount++;
                        }
                    }
                    approx.delete();
                }

                // --- REFERENCE IMAGE COMPARISON (HOMOGRAPHY / FEATURE MATCHING) ---
                orb = new cv.ORB(500, 1.2, 8, 31, 0, 2, cv.ORB_HARRIS_SCORE, 31, 20);
                
                kpCaptured = new cv.KeyPointVector();
                desCaptured = new cv.Mat();
                orb.detectAndCompute(matCaptured, new cv.Mat(), kpCaptured, desCaptured);
                
                kpRef = new cv.KeyPointVector();
                desRef = new cv.Mat();
                orb.detectAndCompute(matRef, new cv.Mat(), kpRef, desRef);

                bf = new cv.BFMatcher(cv.NORM_HAMMING, true);
                matches = new cv.DMatchVector();

                if (desCaptured.empty() || desRef.empty()) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'RESULT', 
                        isValid: false, 
                        score: 0, 
                        matches: 0,
                        reason: 'No features found in one or both images' 
                    }));
                } else {
                    bf.match(desCaptured, desRef, matches);

                    let good_matches_count = 0;
                    let sumScore = 0;
                    
                    for (let i = 0; i < matches.size(); ++i) {
                        let match = matches.get(i);
                        // Strict threshold for feature points matching
                        if (match.distance < 60) {
                            good_matches_count++;
                        }
                        sumScore += match.distance;
                    }
                    let avgScore = matches.size() > 0 ? sumScore / matches.size() : 999;
                    
                    // --- VALIDATION & BACKEND HANDOFF ---
                    // Define strict threshold combining structure (table boxes) and ORB matches
                    // E.g., at least 20 rectangular cells found + at least 30 good ORB match points
                    let isValid = rectCount > 20 && good_matches_count > 30;

                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'RESULT',
                        isValid: isValid,
                        score: avgScore,
                        totalMatches: matches.size(),
                        goodMatches: good_matches_count,
                        rectStructuresDetected: rectCount,
                        message: isValid ? 'Scoresheet Verified.' : 'Image structure does not match a valid scoresheet.'
                    }));
                }
              } catch (e) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: "Analyze Error: " + e.message }));
              } finally {
                // Clean up memory to prevent leaks
                if (matCaptured) matCaptured.delete();
                if (matRef) matRef.delete();
                if (edgesCaptured) edgesCaptured.delete();
                if (contoursCaptured) contoursCaptured.delete();
                if (hierarchyCaptured) hierarchyCaptured.delete();
                if (kpCaptured) kpCaptured.delete();
                if (desCaptured) desCaptured.delete();
                if (kpRef) kpRef.delete();
                if (desRef) desRef.delete();
                if (matches) matches.delete();
                if (bf) bf.delete();
                if (orb) orb.delete();
              }
            }
          } catch (e) {
             window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: "Image load Error: " + e.message }));
          }
        };
      </script>
    </body>
    </html>
  `;

    return (
        <View style={styles.container}>
            {(isProcessing || !isOpencvLoaded) && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#0000ff" />
                    <Text style={styles.loadingText}>
                        {!isOpencvLoaded ? "Loading OpenCV Engine..." : "Validating Scoresheet Structure..."}
                    </Text>
                </View>
            )}
            <WebView
                ref={webviewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                onMessage={onMessage}
                javaScriptEnabled={true}
                style={styles.hiddenWebView}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
    hiddenWebView: {
        width: 0,
        height: 0,
        opacity: 0,
    }
});
