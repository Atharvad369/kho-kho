import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
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
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isOpencvLoaded, setIsOpencvLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const processImages = async () => {
        try {
            setIsProcessing(true);

            let capturedBase64 = '';
            let referenceBase64 = '';

            if (Platform.OS === 'web') {
                // On web, URIs are often already base64 or blob URLs. We need to fetch and convert to base64 if it's a blob.
                const getBase64FromUrl = async (url: string) => {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    return new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                };
                capturedBase64 = await getBase64FromUrl(imageUri);
                referenceBase64 = await getBase64FromUrl(referenceUri);

            } else {
                capturedBase64 = "data:image/jpeg;base64," + await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
                referenceBase64 = "data:image/jpeg;base64," + await FileSystem.readAsStringAsync(referenceUri, { encoding: 'base64' });
            }

            if (Platform.OS === 'web' && iframeRef.current) {
                // On web, pass image data directly via postMessage to avoid string interpolation issues with base64
                iframeRef.current.contentWindow?.postMessage({
                    type: 'PROCESS_IMAGES',
                    capturedSrc: capturedBase64,
                    referenceSrc: referenceBase64,
                }, '*');
            } else {
                const scriptToInject = `
                  if (window.processImages) {
                    window.processImages("${capturedBase64}", "${referenceBase64}");
                  }
                  true;
                `;
                webviewRef.current?.injectJavaScript(scriptToInject);
            }
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

    const handleMessageData = (data: any) => {
        if (data.type === 'READY') {
            setIsOpencvLoaded(true);
        } else if (data.type === 'RESULT') {
            setIsProcessing(false);
            onValidationComplete(data.isValid, data);
        } else if (data.type === 'ERROR') {
            setIsProcessing(false);
            onError('OpenCV Error: ' + data.message);
        }
    };

    const onMessage = (event: WebViewMessageEvent) => {
        try {
            handleMessageData(JSON.parse(event.nativeEvent.data));
        } catch (err: any) {
            onError('Bridge Error: ' + err.message);
        }
    };

    useEffect(() => {
        if (Platform.OS === 'web') {
            const handleWebMessage = (event: MessageEvent) => {
                if (event.data && typeof event.data === 'string') {
                    try {
                        const parsed = JSON.parse(event.data);
                        if (parsed.source === 'opencv-iframe') {
                            handleMessageData(parsed);
                        }
                    } catch (e) { }
                }
            };
            window.addEventListener('message', handleWebMessage);
            return () => window.removeEventListener('message', handleWebMessage);
        }
    }, []);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <script src="https://docs.opencv.org/4.8.0/opencv.js" type="text/javascript"></script>
    </head>
    <body>
      <script>
        // Web wrapper for postMessage
        const postMsg = (data) => {
             const payload = JSON.stringify({ source: 'opencv-iframe', ...data });
             if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                 window.ReactNativeWebView.postMessage(payload); // Mobile
             } else {
                 window.parent.postMessage(payload, '*'); // Web Iframe
             }
        };

        window.addEventListener('message', function(e) {
             if (e.data && e.data.type === 'PROCESS_IMAGES') {
                 // Receive image data directly from parent without eval/interpolation
                 if (window.processImages) {
                     window.processImages(e.data.capturedSrc, e.data.referenceSrc);
                 }
             } else if (e.data && e.data.type === 'EVAL') {
                 try { eval(e.data.script); } catch(err) { console.error("Eval error", err); }
             }
        });

        // Wait until OpenCV is fully initialized
        const initInterval = setInterval(() => {
          if (typeof cv !== 'undefined' && cv.Mat) {
            clearInterval(initInterval);
            postMsg({ type: 'READY' });
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

            imgElement.onerror = () => postMsg({ type: 'ERROR', message: 'Failed to load captured image element' });
            refElement.onerror = () => postMsg({ type: 'ERROR', message: 'Failed to load reference image element' });
            
            imgElement.src = capturedSrc;
            refElement.src = referenceSrc;

            function analyze() {
              let matCaptured = null;
              let matRef = null;
              let grayCaptured = null;
              let grayRef = null;
              let edgesCaptured = null;
              let edgesRef = null;
              let contoursCaptured = null;
              let contoursRef = null;
              let hierarchyCaptured = null;
              let hierarchyRef = null;
              let histCaptured = null;
              let histRef = null;
              let resizedCaptured = null;
              let resizedRef = null;

              try {
                matCaptured = cv.imread(imgElement);
                matRef = cv.imread(refElement);

                // --- STEP 1: CONVERT TO GRAYSCALE ---
                grayCaptured = new cv.Mat();
                grayRef = new cv.Mat();
                cv.cvtColor(matCaptured, grayCaptured, cv.COLOR_RGBA2GRAY, 0);
                cv.cvtColor(matRef, grayRef, cv.COLOR_RGBA2GRAY, 0);

                // --- STEP 2: RESIZE BOTH TO SAME DIMENSIONS FOR COMPARISON ---
                let targetSize = new cv.Size(800, 600);
                resizedCaptured = new cv.Mat();
                resizedRef = new cv.Mat();
                cv.resize(grayCaptured, resizedCaptured, targetSize, 0, 0, cv.INTER_AREA);
                cv.resize(grayRef, resizedRef, targetSize, 0, 0, cv.INTER_AREA);

                // --- SCORE 1: HISTOGRAM COMPARISON (Most reliable for this use case) ---
                let histSize = [256];
                let ranges = [0, 256];
                histCaptured = new cv.Mat();
                histRef = new cv.Mat();
                let capturedVec = new cv.MatVector();
                let refVec = new cv.MatVector();
                capturedVec.push_back(resizedCaptured);
                refVec.push_back(resizedRef);
                cv.calcHist(capturedVec, [0], new cv.Mat(), histCaptured, histSize, ranges, false);
                cv.calcHist(refVec, [0], new cv.Mat(), histRef, histSize, ranges, false);
                cv.normalize(histCaptured, histCaptured, 0, 1, cv.NORM_MINMAX);
                cv.normalize(histRef, histRef, 0, 1, cv.NORM_MINMAX);
                let histScore = cv.compareHist(histCaptured, histRef, cv.HISTCMP_CORREL);
                histScore = Math.max(0, histScore);
                capturedVec.delete();
                refVec.delete();

                // --- SCORE 2: LINE DETECTION (HoughLinesP - Detects grid lines) ---
                // Scoresheets have many organized horizontal/vertical lines; random photos don't
                let binaryCaptured = new cv.Mat();
                let binaryRef = new cv.Mat();
                let blurCaptured = new cv.Mat();
                let blurRef = new cv.Mat();
                let ksize = new cv.Size(5, 5);
                cv.GaussianBlur(resizedCaptured, blurCaptured, ksize, 0);
                cv.GaussianBlur(resizedRef, blurRef, ksize, 0);
                cv.adaptiveThreshold(blurCaptured, binaryCaptured, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 15, 4);
                cv.adaptiveThreshold(blurRef, binaryRef, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 15, 4);

                edgesCaptured = new cv.Mat();
                edgesRef = new cv.Mat();
                cv.Canny(binaryCaptured, edgesCaptured, 50, 150, 3, false);
                cv.Canny(binaryRef, edgesRef, 50, 150, 3, false);

                // Count lines in captured image
                let linesCaptured = new cv.Mat();
                cv.HoughLinesP(edgesCaptured, linesCaptured, 1, Math.PI / 180, 80, 50, 10);
                let hLinesCaptured = 0;
                let vLinesCaptured = 0;
                for (let i = 0; i < linesCaptured.rows; ++i) {
                    let x1 = linesCaptured.data32S[i * 4];
                    let y1 = linesCaptured.data32S[i * 4 + 1];
                    let x2 = linesCaptured.data32S[i * 4 + 2];
                    let y2 = linesCaptured.data32S[i * 4 + 3];
                    let angle = Math.abs(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI);
                    if (angle < 15 || angle > 165) hLinesCaptured++;
                    else if (angle > 75 && angle < 105) vLinesCaptured++;
                }
                let totalLinesCaptured = hLinesCaptured + vLinesCaptured;

                // Count lines in reference
                let linesRef = new cv.Mat();
                cv.HoughLinesP(edgesRef, linesRef, 1, Math.PI / 180, 80, 50, 10);
                let totalLinesRef = linesRef.rows;

                // Line score: ratio of grid lines found vs reference (capped at 1.0)
                let lineScore = 0;
                if (totalLinesRef > 0) {
                    lineScore = Math.min(1, totalLinesCaptured / totalLinesRef);
                }
                // Minimum line threshold: a scoresheet must have at least some grid lines
                if (totalLinesCaptured < 5) lineScore = lineScore * 0.3;

                linesCaptured.delete();
                linesRef.delete();

                // --- SCORE 3: STRUCTURAL ANALYSIS (Rectangle/Grid Cell Detection) ---
                // Use morphological operations to clean up the binary image first
                let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
                let cleanCaptured = new cv.Mat();
                let cleanRef = new cv.Mat();
                cv.morphologyEx(binaryCaptured, cleanCaptured, cv.MORPH_CLOSE, kernel);
                cv.morphologyEx(binaryRef, cleanRef, cv.MORPH_CLOSE, kernel);

                // Find contours in captured image
                let edgesCleanCaptured = new cv.Mat();
                cv.Canny(cleanCaptured, edgesCleanCaptured, 50, 150, 3, false);
                contoursCaptured = new cv.MatVector();
                hierarchyCaptured = new cv.Mat();
                cv.findContours(edgesCleanCaptured, contoursCaptured, hierarchyCaptured, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

                let rectCountCaptured = 0;
                for (let i = 0; i < contoursCaptured.size(); ++i) {
                    let cnt = contoursCaptured.get(i);
                    let approx = new cv.Mat();
                    let peri = cv.arcLength(cnt, true);
                    cv.approxPolyDP(cnt, approx, 0.04 * peri, true);
                    if (approx.rows === 4) {
                        let area = cv.contourArea(approx);
                        if (area > 200) rectCountCaptured++;
                    }
                    approx.delete();
                }

                // Find contours in reference image
                let edgesCleanRef = new cv.Mat();
                cv.Canny(cleanRef, edgesCleanRef, 50, 150, 3, false);
                contoursRef = new cv.MatVector();
                hierarchyRef = new cv.Mat();
                cv.findContours(edgesCleanRef, contoursRef, hierarchyRef, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

                let rectCountRef = 0;
                for (let i = 0; i < contoursRef.size(); ++i) {
                    let cnt = contoursRef.get(i);
                    let approx = new cv.Mat();
                    let peri = cv.arcLength(cnt, true);
                    cv.approxPolyDP(cnt, approx, 0.04 * peri, true);
                    if (approx.rows === 4) {
                        let area = cv.contourArea(approx);
                        if (area > 200) rectCountRef++;
                    }
                    approx.delete();
                }

                let structureScore = 0;
                if (rectCountRef > 0) {
                    structureScore = Math.min(1, rectCountCaptured / rectCountRef);
                }
                if (rectCountCaptured >= 10) {
                    structureScore = Math.min(1, structureScore + 0.15);
                }

                // Cleanup intermediate mats
                binaryCaptured.delete();
                binaryRef.delete();
                blurCaptured.delete();
                blurRef.delete();
                kernel.delete();
                cleanCaptured.delete();
                cleanRef.delete();
                edgesCleanCaptured.delete();
                edgesCleanRef.delete();

                // --- FINAL WEIGHTED SCORE ---
                // 50% histogram (most reliable) + 25% line detection + 25% structure
                let finalScore = (histScore * 50) + (lineScore * 25) + (structureScore * 25);

                let isValidScoresheet = finalScore > 45; // 45% threshold

                console.log('=== OpenCV Validation Debug ===');
                console.log('Histogram Correlation:', (histScore * 100).toFixed(2) + '%');
                console.log('Line Score:', (lineScore * 100).toFixed(2) + '%');
                console.log('H-Lines / V-Lines (Captured):', hLinesCaptured, '/', vLinesCaptured);
                console.log('Total Lines (Captured / Reference):', totalLinesCaptured, '/', totalLinesRef);
                console.log('Structure Score:', (structureScore * 100).toFixed(2) + '%');
                console.log('Rect Count (Captured / Reference):', rectCountCaptured, '/', rectCountRef);
                console.log('Final Weighted Score:', finalScore.toFixed(2) + '%');
                console.log('Is Valid:', isValidScoresheet);
                console.log('===============================');

                postMsg({
                    type: 'RESULT',
                    isValid: isValidScoresheet,
                    score: finalScore,
                    histogramScore: (histScore * 100).toFixed(2),
                    lineScore: (lineScore * 100).toFixed(2),
                    totalLinesCaptured: totalLinesCaptured,
                    totalLinesRef: totalLinesRef,
                    structureScore: (structureScore * 100).toFixed(2),
                    rectCountCaptured: rectCountCaptured,
                    rectCountReference: rectCountRef,
                    message: isValidScoresheet
                        ? 'Scoresheet Verified. Score: ' + finalScore.toFixed(1) + '%'
                        : 'Image does not match scoresheet structure. Score: ' + finalScore.toFixed(1) + '%'
                });

              } catch (e) {
                postMsg({ type: 'ERROR', message: "Analyze Error: " + e.message });
              } finally {
                // Clean up ALL OpenCV objects to prevent memory leaks
                if (matCaptured) matCaptured.delete();
                if (matRef) matRef.delete();
                if (grayCaptured) grayCaptured.delete();
                if (grayRef) grayRef.delete();
                if (resizedCaptured) resizedCaptured.delete();
                if (resizedRef) resizedRef.delete();
                if (histCaptured) histCaptured.delete();
                if (histRef) histRef.delete();
                if (edgesCaptured) edgesCaptured.delete();
                if (edgesRef) edgesRef.delete();
                if (contoursCaptured) contoursCaptured.delete();
                if (contoursRef) contoursRef.delete();
                if (hierarchyCaptured) hierarchyCaptured.delete();
                if (hierarchyRef) hierarchyRef.delete();
              }
            }
          } catch (e) {
             postMsg({ type: 'ERROR', message: "Image load Error: " + e.message });
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
            {Platform.OS === 'web' ? (
                <iframe
                    ref={iframeRef as any}
                    srcDoc={htmlContent}
                    style={Platform.OS === 'web' ? { display: 'none' } : styles.hiddenWebView as any}
                    tabIndex={-1}
                    aria-hidden="true"
                    {...({ inert: true } as any)}
                />
            ) : (
                <WebView
                    ref={webviewRef}
                    originWhitelist={['*']}
                    source={{ html: htmlContent }}
                    onMessage={onMessage}
                    javaScriptEnabled={true}
                    style={styles.hiddenWebView}
                />
            )}
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
