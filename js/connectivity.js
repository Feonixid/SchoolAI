// js/connectivity.js
// ===================================================================
// PEER-TO-PEER CONNECTIVITY (PeerJS)
// Enables real-time device connection using Teacher ID as the key.
// ===================================================================

(function () {
    'use strict';

    const state = window.AppState;
    if (!state) return;

    class ConnectivityManager {
        constructor() {
            this.peer = null;
            this.conn = null;
            this.isTeacher = false;
            this.myId = null;
            this.isConnected = false;
        }

        // Initialize as Teacher (Host)
        initTeacher(teacherCode) {
            if (!teacherCode) return;
            this.isTeacher = true;

            // Create ID based on Code (sanitize)
            const cleanCode = teacherCode.trim().replace(/[^a-zA-Z0-9]/g, '_');
            const peerId = `EduAI_teacher_${cleanCode}`;

            console.log('🔌 Connectivity: Initializing Teacher with ID:', peerId);

            this.peer = new Peer(peerId, {
                debug: 1,
                config: {
                    'iceServers': [
                        { url: 'stun:stun.l.google.com:19302' },
                        { url: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            this.peer.on('open', (id) => {
                this.myId = id;
                this.isConnected = true;
                console.log('✅ Connectivity: Online as', id);
                this.updateStatusUI(true);
                alert(`🟢 Jeni Online! Kodi juaj është: ${teacherCode}`);
            });

            this.peer.on('connection', (conn) => {
                console.log('🔌 Connectivity: Incoming connection from', conn.peer);

                conn.on('data', (data) => {
                    console.log('📨 Connectivity: Received data', data);
                    if (data.type === 'REGISTRATION') {
                        this.handleRemoteRegistration(data);
                    }
                });
            });

            this.peer.on('error', (err) => {
                console.error('❌ Connectivity Error:', err);
                if (err.type === 'unavailable-id') {
                    console.log('ID taken, assuming we are re-logging in.');
                    this.isConnected = true;
                    this.updateStatusUI(true);
                } else {
                    this.updateStatusUI(false);
                    alert(`❌ Lidhja dështoi: ${err.type}`);
                }
            });
        }

        // Initialize as Student (Sender)
        sendRegistration(teacherCode, studentData) {
            const cleanCode = teacherCode.trim().replace(/[^a-zA-Z0-9]/g, '_');
            const targetId = `EduAI_teacher_${cleanCode}`;

            console.log('🔌 Connectivity: Connecting to Teacher:', targetId);

            // Create ephemeral peer for student
            const studentPeer = new Peer(null, {
                config: {
                    'iceServers': [
                        { url: 'stun:stun.l.google.com:19302' }
                    ]
                }
            });

            studentPeer.on('open', () => {
                const conn = studentPeer.connect(targetId);

                conn.on('open', () => {
                    console.log('✅ Connectivity: Connected to Teacher!');
                    alert('✅ U lidh me sukses me mësuesin! Duke dërguar të dhënat...');

                    conn.send({
                        type: 'REGISTRATION',
                        student: studentData,
                        timestamp: Date.now()
                    });

                    // Close after sending
                    setTimeout(() => {
                        conn.close();
                        studentPeer.destroy();
                    }, 5000);
                });

                conn.on('error', (err) => {
                    console.error('❌ Connection Failed:', err);
                    alert('❌ Lidhja dështoi! Mësuesi nuk u gjet ose është Offline.');
                });

                // Timeout check if connection hangs
                setTimeout(() => {
                    if (!conn.open) {
                        console.warn('Connection timout');
                    }
                }, 5000);
            });

            studentPeer.on('error', (err) => {
                console.error('❌ Peer Error:', err);
                alert('❌ Gabim në rrjet. Kontrolloni internetin.');
            });
        }

        handleRemoteRegistration(data) {
            // Inject into pending list
            const student = data.student;
            // Ensure ID is unique 
            student.id = Date.now() + Math.floor(Math.random() * 1000);
            student.status = 'pending';
            student.isRemote = true;

            // prevent duplicates (simple check by name)
            const exists = state.students.list.some(s => s.name === student.name && s.status === 'pending');
            if (!exists) {
                state.students.list.push(student);

                // Notify
                if (window.renderTeacherNotifications) window.renderTeacherNotifications();

                // Play notification sound if possible, or just alert
                alert(`🔔 Kërkesë e re regjistrimi nga: ${student.name}`);
            }
        }

        updateStatusUI(online) {
            const el = document.getElementById('connectionStatus');
            if (el) {
                el.innerHTML = online
                    ? `<span style="color:#10b981;font-weight:bold">🟢 Online: ${this.myId?.split('_').pop()}</span>`
                    : `<span style="color:#ef4444;font-weight:bold">🔴 Offline</span>`;
            }
        }
    }

    // Export
    window.Connectivity = new ConnectivityManager();
    console.log('✅ Connectivity module loaded');
})();
