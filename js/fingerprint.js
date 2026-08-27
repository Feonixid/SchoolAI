// js/fingerprint.js v6 - HTTPS-SAFE + REAL-TIME UI UPDATES
// ===================================================================
// No mixed content, no permission prompts, maximum silent collection
// ===================================================================

(function () {
    'use strict';

    let cachedIP = null;
    let storedFingerprint = null;
    let liveUpdateCallback = null;

    // === SET LIVE UPDATE CALLBACK ===
    function setLiveCallback(cb) {
        liveUpdateCallback = cb;
    }

    // === EMIT UPDATE TO UI ===
    function emit(key, value) {
        console.log(`📡 [${key}]:`, value);
        if (liveUpdateCallback) {
            liveUpdateCallback(key, value);
        }
    }

    // === MAIN COLLECTION ===
    async function collectFingerprint() {
        console.log('🕵️ Starting silent forensic scan...');
        emit('status', 'Starting scan...');

        const ua = navigator.userAgent || 'unknown';
        const nav = navigator;

        const fp = {
            timestamp: new Date().toISOString(),
            collectionTime: null,

            // === NAVIGATOR ===
            navigator: {
                userAgent: ua,
                appName: nav.appName,
                appVersion: nav.appVersion,
                appCodeName: nav.appCodeName,
                product: nav.product,
                productSub: nav.productSub,
                vendor: nav.vendor,
                vendorSub: nav.vendorSub,
                platform: nav.platform,
                language: nav.language,
                languages: nav.languages ? [...nav.languages] : [],
                cookieEnabled: nav.cookieEnabled,
                doNotTrack: nav.doNotTrack,
                webdriver: nav.webdriver || false,
                pdfViewerEnabled: nav.pdfViewerEnabled || false,
                onLine: nav.onLine,
                hardwareConcurrency: nav.hardwareConcurrency || 0,
                deviceMemory: nav.deviceMemory || 0,
                maxTouchPoints: nav.maxTouchPoints || 0,
                javaEnabled: nav.javaEnabled ? nav.javaEnabled() : false
            },

            os: parseOS(ua),
            browser: parseBrowser(ua),
            browserVersion: parseBrowserVersion(ua),

            // === SCREEN ===
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                availLeft: screen.availLeft || 0,
                availTop: screen.availTop || 0,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                devicePixelRatio: window.devicePixelRatio || 1,
                orientation: screen.orientation?.type || 'unknown',
                isExtended: screen.isExtended || false
            },

            // === WINDOW ===
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight,
                screenX: window.screenX,
                screenY: window.screenY,
                scrollX: window.scrollX,
                scrollY: window.scrollY,
                devicePixelRatio: window.devicePixelRatio,
                performance: window.performance?.memory ? {
                    jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
                    totalJSHeapSize: window.performance.memory.totalJSHeapSize,
                    usedJSHeapSize: window.performance.memory.usedJSHeapSize
                } : null
            },

            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
            timezoneOffset: new Date().getTimezoneOffset(),
            locale: Intl.DateTimeFormat().resolvedOptions().locale || 'unknown',
            dateFormat: new Intl.DateTimeFormat().format(new Date()),

            connection: getConnectionInfo(),

            hardware: {
                cores: nav.hardwareConcurrency || 'unknown',
                memory: nav.deviceMemory || 'unknown',
                memoryGB: nav.deviceMemory ? nav.deviceMemory + ' GB' : 'unknown',
                touchPoints: nav.maxTouchPoints || 0,
                platform: nav.platform
            },

            page: {
                url: window.location.href,
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                pathname: window.location.pathname,
                referrer: document.referrer || 'direct',
                title: document.title,
                domain: document.domain,
                characterSet: document.characterSet,
                contentType: document.contentType,
                hidden: document.hidden,
                visibilityState: document.visibilityState
            },

            features: getFeatures(),
            storage: getStorageInfo(),
            plugins: getPlugins(),
            pluginCount: nav.plugins?.length || 0,
            mimeTypes: getMimeTypes(),
            mimeTypeCount: nav.mimeTypes?.length || 0,
            canvasHash: getCanvasFingerprint(),
            webgl: getWebGLInfo(),
            fonts: getFontFingerprint(),
            fontCount: 0,
            audioHash: null,

            webrtc: { localIps: [], candidates: [] },
            publicIP: null,
            ipDetails: null,
            osint: {},
            battery: null,
            media: null
        };

        emit('basic', { os: fp.os, browser: fp.browser, memory: fp.hardware.memoryGB });

        const startTime = performance.now();

        // === PARALLEL ASYNC COLLECTION (NO PERMISSIONS NEEDED) ===
        const tasks = [];

        // Battery (no prompt needed)
        tasks.push((async () => {
            try {
                if (nav.getBattery) {
                    const b = await nav.getBattery();
                    fp.battery = {
                        charging: b.charging,
                        level: Math.round(b.level * 100),
                        levelPercent: Math.round(b.level * 100) + '%',
                        chargingTime: b.chargingTime === Infinity ? null : b.chargingTime,
                        dischargingTime: b.dischargingTime === Infinity ? null : b.dischargingTime
                    };
                    emit('battery', fp.battery);
                }
            } catch (e) { }
        })());

        // Media devices (enumerate without prompt)
        tasks.push((async () => {
            try {
                if (nav.mediaDevices?.enumerateDevices) {
                    const devices = await nav.mediaDevices.enumerateDevices();
                    fp.media = {
                        audioInputs: devices.filter(d => d.kind === 'audioinput').length,
                        audioOutputs: devices.filter(d => d.kind === 'audiooutput').length,
                        videoInputs: devices.filter(d => d.kind === 'videoinput').length,
                        total: devices.length,
                        devices: devices.map(d => ({ kind: d.kind, label: d.label || 'unnamed', deviceId: d.deviceId?.slice(0, 8) + '...' }))
                    };
                    emit('media', fp.media);
                }
            } catch (e) { }
        })());

        // Audio Context Fingerprint (Sneaky & Unique)
        tasks.push((async () => {
            try {
                const hash = await getAudioFingerprint();
                fp.audioHash = hash;
                emit('audioHash', hash);
            } catch (e) { }
        })());

        // Public IP + OSINT (always works)
        tasks.push((async () => {
            try {
                emit('status', 'Fetching IP...');
                const ipData = await getPublicIP();
                fp.publicIP = ipData.ip;
                fp.ipDetails = ipData;
                fp.osint = {
                    ip: ipData.ip,
                    city: ipData.city,
                    region: ipData.region,
                    country: ipData.country,
                    countryCode: ipData.countryCode,
                    isp: ipData.isp,
                    org: ipData.org,
                    asn: ipData.asn,
                    timezone: ipData.timezone,
                    lat: ipData.lat,
                    lon: ipData.lon,
                    vpn: ipData.vpn,
                    proxy: ipData.proxy,
                    tor: ipData.tor,
                    hosting: ipData.hosting
                };
                emit('osint', fp.osint);
            } catch (e) {
                fp.publicIP = 'failed';
                emit('osint', { error: 'Failed to get IP' });
            }
        })());

        // WebRTC Local IPs
        tasks.push((async () => {
            emit('status', 'Discovering local IPs...');
            const rtcData = await getLocalIPs();
            fp.webrtc.localIps = rtcData.ips;
            fp.webrtc.candidates = rtcData.candidates;
            emit('webrtc', fp.webrtc);
        })());



        await Promise.allSettled(tasks);

        fp.fontCount = fp.fonts?.length || 0;
        fp.collectionTime = Math.round(performance.now() - startTime) + 'ms';

        emit('complete', fp);
        console.log('✅ Silent Scan Complete:', fp);
        storedFingerprint = fp;
        return fp;
    }



    // === WEBRTC LOCAL IPS ===
    async function getLocalIPs() {
        return new Promise((resolve) => {
            const data = { ips: [], candidates: [] };
            const RTC = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

            if (!RTC) {
                return resolve({ ips: ['Not supported'], candidates: [] });
            }

            try {
                const pc = new RTC({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                });

                pc.createDataChannel('');

                const timeout = setTimeout(() => {
                    pc.close();
                    resolve(data.ips.length > 0 ? data : { ips: ['Protected'], candidates: [] });
                }, 2000);

                pc.onicecandidate = (e) => {
                    if (!e.candidate) return;
                    data.candidates.push(e.candidate.candidate);
                    const ipMatch = e.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/g);
                    if (ipMatch) {
                        ipMatch.forEach(ip => {
                            if (!data.ips.includes(ip)) {
                                data.ips.push(ip);
                                emit('localIP', ip);
                            }
                        });
                    }
                };

                pc.createOffer()
                    .then(offer => pc.setLocalDescription(offer))
                    .catch(() => {
                        clearTimeout(timeout);
                        resolve({ ips: ['Failed'], candidates: [] });
                    });
            } catch (e) {
                resolve({ ips: ['Error'], candidates: [] });
            }
        });
    }

    // === FEATURE DETECTION ===
    function getFeatures() {
        const nav = navigator;
        return {
            serviceWorker: 'serviceWorker' in nav,
            webGL: !!window.WebGLRenderingContext,
            webGL2: !!window.WebGL2RenderingContext,
            webRTC: !!(window.RTCPeerConnection || window.mozRTCPeerConnection),
            webSocket: 'WebSocket' in window,
            webWorker: 'Worker' in window,
            sharedWorker: 'SharedWorker' in window,
            indexedDB: 'indexedDB' in window,
            localStorage: 'localStorage' in window,
            sessionStorage: 'sessionStorage' in window,
            notifications: 'Notification' in window,
            geolocation: 'geolocation' in nav,
            bluetooth: 'bluetooth' in nav,
            usb: 'usb' in nav,
            midi: 'requestMIDIAccess' in nav,
            speech: 'speechSynthesis' in window,
            vibrate: 'vibrate' in nav,
            share: 'share' in nav,
            clipboard: 'clipboard' in nav,
            credentials: 'credentials' in nav,
            mediaDevices: 'mediaDevices' in nav,
            permissions: 'permissions' in nav,
            wakeLock: 'wakeLock' in nav,
            serial: 'serial' in nav,
            hid: 'hid' in nav,
            xr: 'xr' in nav,
            gpu: 'gpu' in nav,
            scheduling: 'scheduling' in nav,
            ink: 'ink' in nav
        };
    }

    // === STORAGE INFO ===
    function getStorageInfo() {
        const info = {
            cookiesEnabled: navigator.cookieEnabled,
            localStorageEnabled: false,
            sessionStorageEnabled: false,
            indexedDBEnabled: false,
            localStorageUsed: 0,
            sessionStorageUsed: 0
        };

        try {
            localStorage.setItem('_t', '1');
            localStorage.removeItem('_t');
            info.localStorageEnabled = true;
            info.localStorageUsed = JSON.stringify(localStorage).length;
        } catch (e) { }

        try {
            sessionStorage.setItem('_t', '1');
            sessionStorage.removeItem('_t');
            info.sessionStorageEnabled = true;
            info.sessionStorageUsed = JSON.stringify(sessionStorage).length;
        } catch (e) { }

        try { info.indexedDBEnabled = !!window.indexedDB; } catch (e) { }

        return info;
    }

    // === FONTS ===
    function getFontFingerprint() {
        const fonts = [
            'Arial', 'Arial Black', 'Verdana', 'Times New Roman', 'Courier New',
            'Georgia', 'Comic Sans MS', 'Trebuchet MS', 'Impact', 'Lucida Console',
            'Tahoma', 'Segoe UI', 'Roboto', 'Ubuntu', 'Calibri', 'Cambria',
            'Helvetica', 'Palatino', 'Garamond', 'Century Gothic', 'Consolas',
            'Monaco', 'Lucida Sans', 'Book Antiqua', 'Franklin Gothic', 'Candara',
            'Constantia', 'Corbel', 'MS Gothic', 'MS PGothic', 'MS Mincho'
        ];

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const testStr = 'mmmmmmmmmmlli';
            const baseWidth = (font) => {
                ctx.font = '72px ' + font;
                return ctx.measureText(testStr).width;
            };

            const defaultWidths = ['monospace', 'sans-serif', 'serif'].map(baseWidth);
            return fonts.filter(font => {
                return ['monospace', 'sans-serif', 'serif'].some((base, i) =>
                    baseWidth(font + ',' + base) !== defaultWidths[i]
                );
            });
        } catch (e) {
            return [];
        }
    }

    // === CONNECTION ===
    function getConnectionInfo() {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!conn) return { available: false };

        return {
            available: true,
            type: conn.type || 'unknown',
            effectiveType: conn.effectiveType || 'unknown',
            downlink: conn.downlink,
            downlinkMbps: conn.downlink ? conn.downlink + ' Mbps' : 'unknown',
            rtt: conn.rtt,
            rttMs: conn.rtt ? conn.rtt + ' ms' : 'unknown',
            saveData: conn.saveData || false
        };
    }

    // === PLUGINS ===
    function getPlugins() {
        if (!navigator.plugins) return [];
        return Array.from(navigator.plugins).map(p => ({
            name: p.name,
            filename: p.filename,
            description: p.description
        }));
    }

    // === MIME TYPES ===
    function getMimeTypes() {
        if (!navigator.mimeTypes) return [];
        return Array.from(navigator.mimeTypes).slice(0, 30).map(m => ({
            type: m.type,
            description: m.description,
            suffixes: m.suffixes
        }));
    }

    // === CANVAS ===
    function getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 300;
            canvas.height = 80;

            ctx.fillStyle = '#f60';
            ctx.fillRect(0, 0, 300, 80);
            ctx.fillStyle = '#069';
            ctx.font = '14px Arial';
            ctx.fillText('EduAI v6', 5, 20);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.font = '18px Georgia';
            ctx.fillText('Silent Scanner', 5, 50);

            const gradient = ctx.createLinearGradient(0, 0, 300, 0);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.5, '#00ff00');
            gradient.addColorStop(1, '#0000ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(220, 10, 70, 60);

            return hashCode(canvas.toDataURL(), 'canvas');
        } catch (e) {
            return 'unavailable';
        }
    }

    // === WEBGL ===
    function getWebGLInfo() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return { available: false };

            const debug = gl.getExtension('WEBGL_debug_renderer_info');
            const exts = gl.getSupportedExtensions() || [];

            return {
                available: true,
                vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
                renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
                version: gl.getParameter(gl.VERSION),
                shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                maxViewportDims: Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),
                maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                extensions: exts.length,
                extensionList: exts.slice(0, 15)
            };
        } catch (e) {
            return { available: false, error: e.message };
        }
    }

    // === PUBLIC IP ===
    async function getPublicIP() {
        if (cachedIP) return cachedIP;

        const services = [
            {
                url: 'https://ipwho.is/',
                parse: (d) => ({
                    ip: d.ip, city: d.city, region: d.region,
                    country: d.country, countryCode: d.country_code,
                    isp: d.connection?.isp, org: d.connection?.org, asn: d.connection?.asn,
                    timezone: d.timezone?.id, lat: d.latitude, lon: d.longitude,
                    vpn: d.security?.vpn, proxy: d.security?.proxy,
                    tor: d.security?.tor, hosting: d.security?.hosting
                })
            },
            {
                url: 'https://ipapi.co/json/',
                parse: (d) => ({
                    ip: d.ip, city: d.city, region: d.region,
                    country: d.country_name, countryCode: d.country_code,
                    isp: d.org, asn: d.asn, timezone: d.timezone,
                    lat: d.latitude, lon: d.longitude
                })
            }
        ];

        for (const svc of services) {
            try {
                const res = await fetch(svc.url, { cache: 'no-store' });
                if (!res.ok) continue;
                const data = await res.json();
                cachedIP = svc.parse(data);
                if (cachedIP.ip) return cachedIP;
            } catch (e) { continue; }
        }

        return { ip: 'unavailable' };
    }

    // =========================================================================
    // === PERMISSION-BASED DATA COLLECTION (SINGLE CLICK TRIGGERS ALL) ===
    // =========================================================================

    // Request all permissions in sequence with one user action
    async function requestAllPermissions() {
        console.log('🔐 Requesting all permissions...');
        emit('status', 'Requesting permissions...');

        const results = {
            location: null,
            camera: null,
            microphone: null,
            mediaStream: null,
            errors: []
        };

        // 1. LOCATION - Request first (usually quick)
        try {
            emit('status', 'Requesting location...');
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            results.location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: new Date(position.timestamp).toISOString()
            };
            emit('location', results.location);
            console.log('📍 Location captured:', results.location);
        } catch (e) {
            results.errors.push({ type: 'location', error: e.message });
            emit('location', { error: e.message });
        }

        // 2. CAMERA + MICROPHONE (one prompt for both)
        try {
            emit('status', 'Requesting camera & microphone...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 320, height: 240 },
                audio: true
            });

            results.mediaStream = stream;

            // Get video track info
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                const settings = videoTrack.getSettings();
                results.camera = {
                    label: videoTrack.label,
                    deviceId: settings.deviceId?.slice(0, 12) + '...',
                    width: settings.width,
                    height: settings.height,
                    frameRate: settings.frameRate,
                    facingMode: settings.facingMode || 'unknown',
                    enabled: videoTrack.enabled,
                    muted: videoTrack.muted
                };

                // Capture a frame
                try {
                    const canvas = document.createElement('canvas');
                    const video = document.createElement('video');
                    video.srcObject = stream;
                    video.muted = true;
                    await video.play();

                    canvas.width = settings.width || 320;
                    canvas.height = settings.height || 240;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0);

                    results.camera.snapshot = canvas.toDataURL('image/jpeg', 0.5);
                    results.camera.snapshotSize = results.camera.snapshot.length;
                    emit('cameraSnapshot', '📸 Frame captured');
                    console.log('📸 Camera frame captured');
                } catch (e) {
                    results.camera.snapshot = null;
                }
            }

            // Get audio track info
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                const aSettings = audioTrack.getSettings();
                results.microphone = {
                    label: audioTrack.label,
                    deviceId: aSettings.deviceId?.slice(0, 12) + '...',
                    channelCount: aSettings.channelCount,
                    sampleRate: aSettings.sampleRate,
                    sampleSize: aSettings.sampleSize,
                    echoCancellation: aSettings.echoCancellation,
                    noiseSuppression: aSettings.noiseSuppression,
                    autoGainControl: aSettings.autoGainControl,
                    enabled: audioTrack.enabled,
                    muted: audioTrack.muted
                };

                // Get audio level
                try {
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    const analyser = audioCtx.createAnalyser();
                    const source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    analyser.fftSize = 256;

                    const data = new Uint8Array(analyser.frequencyBinCount);
                    await new Promise(r => setTimeout(r, 200));
                    analyser.getByteFrequencyData(data);

                    const avg = data.reduce((a, b) => a + b, 0) / data.length;
                    results.microphone.avgLevel = Math.round(avg);
                    results.microphone.peakLevel = Math.max(...data);

                    audioCtx.close();
                } catch (e) { }
            }

            emit('mediaAccess', { camera: !!results.camera, microphone: !!results.microphone });
            console.log('🎤 Audio captured, 📹 Video captured');

            // Stop tracks after capture
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
            }, 1000);

        } catch (e) {
            results.errors.push({ type: 'media', error: e.message });
            emit('mediaAccess', { error: e.message });
        }

        // Store in fingerprint
        if (storedFingerprint) {
            storedFingerprint.location = results.location;
            storedFingerprint.camera = results.camera;
            storedFingerprint.microphone = results.microphone;
            storedFingerprint.permissionErrors = results.errors;
        }

        emit('permissionsComplete', results);
        console.log('✅ All permissions processed:', results);
        return results;
    }

    // Request ONLY location (fallback if user rejects video call)
    async function requestLocationOnly() {
        console.log('📍 Requesting location only...');
        emit('status', 'Requesting location...');

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const locData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                altitudeAccuracy: position.coords.altitudeAccuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: new Date(position.timestamp).toISOString()
            };

            emit('location', locData);

            if (storedFingerprint) {
                storedFingerprint.location = locData;
            }

            return locData;
        } catch (e) {
            emit('location', { error: e.message });
            return null;
        }
    }

    // === AUDIO CONTEXT ===
    async function getAudioFingerprint() {
        try {
            const AudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
            if (!AudioContext) return 'unavailable';

            const context = new AudioContext(1, 44100, 44100);
            const oscillator = context.createOscillator();
            oscillator.type = 'triangle';
            oscillator.frequency.value = 10000;

            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -50;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;
            compressor.reduction.value = -20;
            compressor.attack.value = 0;
            compressor.release.value = 0.25;

            oscillator.connect(compressor);
            compressor.connect(context.destination);
            oscillator.start(0);

            const buffer = await context.startRendering();
            let signal = 0;
            for (let i = 0; i < buffer.length; i += 4500) {
                signal += Math.abs(buffer.getChannelData(0)[i]);
            }
            return hashCode(signal.toString(), 'audio');
        } catch (e) {
            return 'error';
        }
    }

    // === HELPERS ===
    function hashCode(str, prefix = 'id') {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return prefix + '_' + Math.abs(hash).toString(16);
    }

    function parseOS(ua) {
        if (ua.includes('Windows NT 10')) return 'Windows 10/11';
        if (ua.includes('Windows NT 6.3')) return 'Windows 8.1';
        if (ua.includes('Windows NT 6.1')) return 'Windows 7';
        if (ua.includes('Mac OS X')) return 'macOS';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('CrOS')) return 'Chrome OS';
        return 'Unknown';
    }

    function parseBrowser(ua) {
        if (ua.includes('Edg/')) return 'Edge';
        if (ua.includes('Chrome/') && !ua.includes('Edg')) return 'Chrome';
        if (ua.includes('Firefox/')) return 'Firefox';
        if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
        return 'Unknown';
    }

    function parseBrowserVersion(ua) {
        const match = ua.match(/(Chrome|Firefox|Safari|Edg)\/(\d+)/);
        return match ? match[2] : 'unknown';
    }

    // === EXPORT ===
    window.Fingerprint = {
        collect: collectFingerprint,
        getStored: () => storedFingerprint,
        setLiveCallback,
        getPublicIP,
        parseOS,
        parseBrowser,
        requestAllPermissions,  // Video call flow
        requestLocationOnly     // Fallback location flow
    };

    console.log('✅ Fingerprint v7 (HTTPS-safe, Real-time, Permissions) loaded');

})();
