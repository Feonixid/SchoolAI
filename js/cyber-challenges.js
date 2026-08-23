// js/cyber-challenges.js
// High-Fidelity Cybersecurity Terminal & Linux Sandbox Simulator
// ===================================================================

(function () {
  'use strict';

  // Helper for hash computation in browser
  async function computeHash(algorithm, text) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return `Error generating hash: ${e.message}`;
    }
  }

  // Simple MD5 simulation
  function simpleMD5(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return (hex + hex + hex + hex).substring(0, 32);
  }

  // ROT13 / Caesar cipher
  function rot13(str) {
    return str.replace(/[a-zA-Z]/g, function (c) {
      return String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26);
    });
  }

  // ----------------------------------------------------------------
  // SIMULATED COMMANDS (30+ Authentic Linux & Cybersecurity Tools)
  // ----------------------------------------------------------------
  const SIMULATED_COMMANDS = {
    // ── 1. Network Reconnaissance ──────────────────────────────────
    'nmap': {
      description: 'Network exploration and port vulnerability scanner',
      usage: 'nmap [target] [options]',
      execute: (args) => {
        const target = args.find(a => !a.startsWith('-')) || '192.168.1.1';
        const opts = args.join(' ');

        if (opts.includes('-sV') || opts.includes('-A')) {
          return `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toISOString().replace('T', ' ').substring(0, 19)}
Nmap scan report for ${target} (192.168.1.105)
Host is up (0.0018s latency).
Not shown: 994 closed tcp ports (reset)

PORT     STATE SERVICE     VERSION
22/tcp   open  ssh         OpenSSH 8.9p1 Ubuntu 3ubuntu0.6 (Ubuntu Linux; protocol 2.0)
80/tcp   open  http        Apache httpd 2.4.52 ((Ubuntu) OpenSSL/3.0.2)
|_http-server-header: Apache/2.4.52 (Ubuntu)
|_http-title: EduAI School Management Portal
443/tcp  open  ssl/http    nginx 1.18.0 (Ubuntu)
|_http-title: 400 The plain HTTP request was sent to HTTPS port
| ssl-cert: Subject: commonName=eduai.internal/organizationName=EduAI School
3306/tcp open  mysql       MySQL 8.0.35-0ubuntu0.22.04.1
8080/tcp open  http-proxy  Squid http proxy 5.7
8443/tcp open  ssl/https-alt Node.js Express Framework

Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 4.12 seconds`;
        }

        if (opts.includes('--script vuln')) {
          return `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for ${target}
PORT     STATE SERVICE
80/tcp   open  http
|_http-csrf: Couldn't find any CSRF vulnerabilities.
|_http-dombased-xss: Couldn't find any DOM based XSS.
| http-slowloris-check: 
|   VULNERABLE:
|   Slowloris DOS attack
|     State: LIKELY VULNERABLE
|     IDs:  CVE:CVE-2007-6750
443/tcp  open  https
| ssl-poodle: 
|   VULNERABLE:
|   SSL POODLE Information Disclosure
|     State: VULNERABLE
|     IDs:  CVE:CVE-2014-3566

Nmap done: 1 IP address (1 host up) scanned in 14.82 seconds`;
        }

        if (opts.includes('-p-')) {
          return `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for ${target}
Host is up (0.0012s latency).
Not shown: 65530 closed tcp ports (conn-refused)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
443/tcp  open  https
3306/tcp open  mysql
8080/tcp open  http-proxy

Nmap done: 1 IP address (1 host up) scanned in 18.45 seconds`;
        }

        // Standard fast scan
        return `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for ${target}
Host is up (0.00094s latency).
Not shown: 997 closed tcp ports (reset)
PORT    STATE SERVICE
22/tcp  open  ssh
80/tcp  open  http
443/tcp open  https

Nmap done: 1 IP address (1 host up) scanned in 1.42 seconds`;
      }
    },

    'ping': {
      description: 'Send ICMP ECHO_REQUEST packets to network hosts',
      usage: 'ping <host> [-c count]',
      execute: (args) => {
        const host = args.find(a => !a.startsWith('-')) || 'google.com';
        const ip = host.includes('.') && !host.includes('google') ? host : '142.250.180.206';
        let res = `PING ${host} (${ip}) 56(84) bytes of data.\n`;
        const times = [12.4, 11.8, 13.1, 12.0];
        times.forEach((t, i) => {
          res += `64 bytes from ${ip}: icmp_seq=${i + 1} ttl=116 time=${t} ms\n`;
        });
        res += `\n--- ${host} ping statistics ---\n`;
        res += `4 packets transmitted, 4 received, 0% packet loss, time 3004ms\n`;
        res += `rtt min/avg/max/mdev = 11.802/12.325/13.104/0.498 ms`;
        return res;
      }
    },

    'traceroute': {
      description: 'Print the route packets take to network host',
      usage: 'traceroute <host>',
      execute: (args) => {
        const host = args[0] || 'google.com';
        return `traceroute to ${host} (142.250.180.206), 30 hops max, 60 byte packets
 1  _gateway (192.168.1.1)  0.642 ms  0.598 ms  0.581 ms
 2  10.150.0.1 (10.150.0.1)  2.415 ms  2.390 ms  2.371 ms
 3  100.64.12.8 (100.64.12.8)  8.120 ms  8.095 ms  8.077 ms
 4  core-router.isp.al (185.12.90.1)  11.450 ms  11.425 ms  11.401 ms
 5  google-peering.fra.ixp (80.81.192.14)  24.120 ms  24.095 ms  24.070 ms
 6  108.170.248.65 (108.170.248.65)  25.340 ms  25.312 ms  25.290 ms
 7  ${host} (142.250.180.206)  24.890 ms  24.865 ms  24.840 ms`;
      }
    },

    'whois': {
      description: 'Client for the WHOIS directory service',
      usage: 'whois <domain>',
      execute: (args) => {
        const domain = (args[0] || 'example.com').toLowerCase();
        return `   Domain Name: ${domain.toUpperCase()}
   Registry Domain ID: 2336799_DOMAIN_COM-VRSN
   Registrar WHOIS Server: whois.iana.org
   Registrar URL: http://www.iana.org
   Updated Date: 2024-02-14T07:15:32Z
   Creation Date: 1995-08-14T04:00:00Z
   Registry Expiry Date: 2026-08-13T04:00:00Z
   Registrar: Internet Assigned Numbers Authority
   Registrar IANA ID: 376
   Registrar Abuse Contact Email: abuse@iana.org
   Registrar Abuse Contact Phone: +1.3108239358
   Domain Status: clientDeleteProhibited
   Domain Status: clientTransferProhibited
   Name Server: A.IANA-SERVERS.NET
   Name Server: B.IANA-SERVERS.NET
   DNSSEC: signedDelegation
   DNSSEC DS Data: 370 13 2 49FD46E6C4B45C55D4AC...`;
      }
    },

    'dig': {
      description: 'DNS lookup utility',
      usage: 'dig <domain> [A|MX|NS|TXT]',
      execute: (args) => {
        const domain = args.find(a => !a.startsWith('+') && !['A','MX','NS','TXT','AAAA'].includes(a.toUpperCase())) || 'school.edu.al';
        const type = (args.find(a => ['A','MX','NS','TXT','AAAA'].includes(a.toUpperCase())) || 'A').toUpperCase();

        return `; <<>> DiG 9.18.18-0ubuntu0.22.04.1-Ubuntu <<>> ${domain} ${type}
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48192
;; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;${domain}.			IN	${type}

;; ANSWER SECTION:
${type === 'MX' ? `${domain}.		300	IN	MX	10 mail.${domain}.\n${domain}.		300	IN	MX	20 backup-mail.${domain}.` :
  type === 'NS' ? `${domain}.		86400	IN	NS	ns1.${domain}.\n${domain}.		86400	IN	NS	ns2.${domain}.` :
  type === 'TXT' ? `${domain}.		300	IN	TXT	"v=spf1 include:_spf.google.com ~all"\n${domain}.		300	IN	TXT	"google-site-verification=abcdef123456"` :
  `${domain}.		300	IN	A	185.120.44.12\n${domain}.		300	IN	A	185.120.44.13`}

;; Query time: 14 msec
;; SERVER: 1.1.1.1#53(1.1.1.1) (UDP)
;; WHEN: ${new Date().toUTCString()}
;; MSG SIZE  rcvd: 88`;
      }
    },

    'nslookup': {
      description: 'Query Internet name servers interactively',
      usage: 'nslookup <domain>',
      execute: (args) => {
        const domain = args[0] || 'eduai.school';
        return `Server:		1.1.1.1
Address:	1.1.1.1#53

Non-authoritative answer:
Name:	${domain}
Address: 104.21.48.112
Name:	${domain}
Address: 172.67.182.204`;
      }
    },

    'curl': {
      description: 'Transfer data from or to a server',
      usage: 'curl [options] <url>',
      execute: (args) => {
        const url = args.find(a => a.startsWith('http')) || 'https://api.school.internal/status';
        if (args.includes('-I') || args.includes('--head')) {
          return `HTTP/2 200 
server: nginx/1.18.0 (Ubuntu)
date: ${new Date().toUTCString()}
content-type: application/json; charset=utf-8
content-length: 142
strict-transport-security: max-age=31536000; includeSubDomains
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
x-xss-protection: 1; mode=block`;
        }

        return `{\n  "status": "online",\n  "system": "EduAI High School Cluster",\n  "version": "4.2.0-secure",\n  "authenticated": false,\n  "endpoints": ["/api/students", "/api/curriculum", "/api/grades"]\n}`;
      }
    },

    // ── 2. Cryptography & Password Cracking ────────────────────────
    'base64': {
      description: 'Base64 encode or decode data',
      usage: 'base64 [-d] <string>',
      execute: (args) => {
        if (args[0] === '-d' || args[0] === '--decode') {
          const target = args.slice(1).join(' ');
          try {
            return atob(target);
          } catch (e) {
            return `base64: invalid input`;
          }
        }
        const target = args.join(' ') || 'EduAI Cybersecurity 2026';
        return btoa(target);
      }
    },

    'rot13': {
      description: 'Rotate text by 13 characters (Caesar cipher)',
      usage: 'rot13 <text>',
      execute: (args) => {
        const text = args.join(' ') || 'Synt{rqhnv_plore_svaq_z3}';
        return rot13(text);
      }
    },

    'sha256sum': {
      description: 'Compute SHA256 cryptographic digest',
      usage: 'sha256sum <text/file>',
      execute: (args) => {
        const text = args.join(' ') || 'admin';
        return `${computeHash('SHA-256', text)}  -`;
      }
    },

    'md5sum': {
      description: 'Compute MD5 cryptographic checksum',
      usage: 'md5sum <text/file>',
      execute: (args) => {
        const text = args.join(' ') || 'admin';
        return `${simpleMD5(text)}  -`;
      }
    },

    'john': {
      description: 'John the Ripper password cracker',
      usage: 'john --wordlist=<wordlist> <hashfile>',
      execute: (args) => {
        return `Using default input encoding: UTF-8
Loaded 1 password hash (sha256crypt, crypt(3) $5$ [SHA256 128/128 AVX2 8x])
Cost 1 (iteration count) is 5000 for all loaded hashes
Will run 8 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
albania2024      (student_usr)     
1g 0:00:00:00 DONE (2024-02-14 10:14) 33.33g/s 38400p/s 38400c/s 38400C/s 123456..albania2024
Use the "--show" option to display all of the cracked passwords reliably
Session completed`;
      }
    },

    'hydra': {
      description: 'Very fast network logon cracker',
      usage: 'hydra -l <user> -P <passlist> <target> <service>',
      execute: (args) => {
        const target = args.find(a => !a.startsWith('-') && a.includes('.')) || '192.168.1.100';
        return `Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes.

[DATA] max 16 tasks per 1 server, overall 16 tasks, 140 login tries (l:1/p:140), ~8 tries per task
[DATA] attacking ssh://${target}:22/
[STATUS] 48.00 tries/min, 48 tries in 00:01h, 92 to do in 00:02h, 16 active
[22][ssh] host: ${target}   login: admin   password: Password2024!
[STATUS] attack finished for ${target} (1 valid password found)`;
      }
    },

    'hashcat': {
      description: 'World fastest and most advanced password recovery utility',
      usage: 'hashcat -m <mode> -a 0 <hash> <wordlist>',
      execute: (args) => {
        return `hashcat (v6.2.6) starting in benchmark mode...

OpenCL API (OpenCL 3.0 CUDA 12.0.1) - Platform #1 [NVIDIA Corporation]
========================================================================
* Device #1: NVIDIA GeForce RTX, 8192/16384 MB (2048 MB allocatable), 36MCU

Hash.Mode........: 0 (MD5)
Hash.Target......: 5d41402abc4b2a76b9719d911017c592
Time.Started.....: ${new Date().toLocaleTimeString()}
Time.Estimated...: ${new Date().toLocaleTimeString()} (0 secs)
Guess.Base.......: File (rockyou.txt)
Speed.#1.........: 12450.2 MH/s (12.45GH/s)
Recovered........: 1/1 (100.00%) Digests

5d41402abc4b2a76b9719d911017c592:hello

Session..........: hashcat
Status...........: Cracked`;
      }
    },

    'openssl': {
      description: 'OpenSSL command line tool for cryptography & TLS',
      usage: 'openssl [s_client|enc|genrsa|req|x509]',
      execute: (args) => {
        const sub = args[0];
        if (sub === 's_client') {
          return `CONNECTED(00000003)
depth=2 C = US, O = Internet Security Research Group, CN = ISRG Root X1
verify return:1
depth=1 C = US, O = Let's Encrypt, CN = R3
verify return:1
depth=0 CN = school.edu.al
verify return:1
---
Certificate chain
 0 s:CN = school.edu.al
   i:C = US, O = Let's Encrypt, CN = R3
   a:PKEY: rsaEncryption, 2048 (bit); sigalg: RSA-SHA256
---
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Server public key is 2048 bit
Secure Renegotiation IS NOT supported
Compression: NONE
Expansion: NONE
No ALPN negotiated
Early data was not sent
Verify return code: 0 (ok)`;
        }
        return `OpenSSL 3.0.2 15 Mar 2022 (Library: OpenSSL 3.0.2)\nCommands: s_client, enc, genrsa, rsa, req, x509, dgst, rand`;
      }
    },

    // ── 3. Vulnerability Testing & Web Assessment ──────────────────
    'sqlmap': {
      description: 'Automatic SQL injection and database takeover tool',
      usage: 'sqlmap -u "<url>" [options]',
      execute: (args) => {
        const url = args.find(a => a.startsWith('http')) || 'http://school.edu.al/grades.php?id=1';
        return `        ___
       __H__
 ___ ___[.]_____ ___ ___  {1.7.2#stable}
|_ -| . ["]     | .'| . |
|___|_  [.]_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org

[*] starting @ ${new Date().toLocaleTimeString()}

[INFO] testing connection to the target URL: ${url}
[INFO] checking if the target is protected by some kind of WAF/IPS
[INFO] testing if the parameter 'id' is dynamic
[INFO] confirming that parameter 'id' is dynamic
[INFO] heuristic (basic) test shows that parameter 'id' might be injectable (possible DBMS: 'MySQL')
[INFO] parameter 'id' appears to be 'AND/OR time-based blind - WHERE or HAVING clause' injectable 

GET parameter 'id' is vulnerable. Do you want to keep testing the others (if any)? [y/N] N
sqlmap identified the following injection point(s) with a total of 42 HTTP(s) requests:
---
Parameter: id (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: id=1 AND 8192=8192

    Type: time-based blind
    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)
    Payload: id=1 AND (SELECT 9182 FROM (SELECT(SLEEP(5)))xyz)
---
[INFO] the back-end DBMS is MySQL
web server operating system: Linux Ubuntu
web application technology: Apache 2.4.52, PHP 8.1.2
back-end DBMS: MySQL >= 5.0.12`;
      }
    },

    'gobuster': {
      description: 'Directory/File, DNS and VHost busting tool',
      usage: 'gobuster dir -u <url> -w <wordlist>',
      execute: (args) => {
        const url = args.find(a => a.startsWith('http')) || 'http://portal.school.internal';
        return `===============================================================
Gobuster v3.5
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     ${url}
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
[+] Status codes:            200,204,301,302,370,401,403
===============================================================
Starting gobuster dir in directory enumeration mode
===============================================================
/admin                (Status: 301) [Size: 178] [--> ${url}/admin/]
/api                  (Status: 200) [Size: 421]
/backup               (Status: 403) [Size: 278]
/config.php.bak       (Status: 200) [Size: 1042]
/css                  (Status: 301) [Size: 178]
/js                   (Status: 301) [Size: 178]
/login                (Status: 200) [Size: 2450]
/robots.txt           (Status: 200) [Size: 154]
===============================================================
Finished`;
      }
    },

    'wireshark': {
      description: 'Network protocol analyzer (terminal packet summary)',
      usage: 'wireshark / tshark [options]',
      execute: (args) => {
        return `Capturing on 'eth0'
  1 0.000000 192.168.1.105 → 1.1.1.1      DNS 74 Standard query 0x1a2b A school.edu.al
  2 0.012450      1.1.1.1 → 192.168.1.105 DNS 90 Standard query response 0x1a2b A 185.120.44.12
  3 0.014120 192.168.1.105 → 185.120.44.12 TCP 74 54312 → 443 [SYN] Seq=0 Win=64240 Len=0 MSS=1460
  4 0.026340 185.120.44.12 → 192.168.1.105 TCP 74 443 → 54312 [SYN, ACK] Seq=0 Ack=1 Win=65160 Len=0
  5 0.026410 192.168.1.105 → 185.120.44.12 TCP 66 54312 → 443 [ACK] Seq=1 Ack=1 Win=64240 Len=0
  6 0.028900 192.168.1.105 → 185.120.44.12 TLSv1.3 583 Client Hello
6 packets captured`;
      }
    },

    'tcpdump': {
      description: 'Dump traffic on a network',
      usage: 'tcpdump -i <interface> [filter]',
      execute: (args) => {
        return `tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
10:14:02.124501 IP 192.168.1.105.52410 > 8.8.8.8.53: 1245+ A? google.com. (28)
10:14:02.138902 IP 8.8.8.8.53 > 192.168.1.105.52410: 1245 1/0/0 A 142.250.180.206 (44)
10:14:02.140120 IP 192.168.1.105.48912 > 142.250.180.206.443: Flags [S], seq 389124, win 64240, length 0
10:14:02.155430 IP 142.250.180.206.443 > 192.168.1.105.48912: Flags [S.], seq 891240, ack 389125, win 65535, length 0
4 packets captured, 4 packets received by filter, 0 packets dropped by kernel`;
      }
    },

    // ── 4. Linux Core System Utilities ─────────────────────────────
    'uname': {
      description: 'Print system information',
      usage: 'uname [-a]',
      execute: (args) => `Linux kali-eduai 6.1.0-kali7-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.1.20-1kali1 (2023-04-12) x86_64 GNU/Linux`
    },

    'whoami': {
      description: 'Print effective userid',
      usage: 'whoami',
      execute: () => 'shqipai'
    },

    'id': {
      description: 'Print real and effective user and group IDs',
      usage: 'id',
      execute: () => 'uid=1000(shqipai) gid=1000(shqipai) groups=1000(shqipai),27(sudo),100(users)'
    },

    'pwd': {
      description: 'Print name of current/working directory',
      usage: 'pwd',
      execute: () => '/home/shqipai/lab'
    },

    'date': {
      description: 'Display or set date and time',
      usage: 'date',
      execute: () => new Date().toString()
    },

    'uptime': {
      description: 'Tell how long the system has been running',
      usage: 'uptime',
      execute: () => ` 10:14:22 up 14 days,  3:42,  1 user,  load average: 0.12, 0.08, 0.02`
    },

    'ifconfig': {
      description: 'Configure network interface parameters',
      usage: 'ifconfig',
      execute: () => `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.105  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>
        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)
        RX packets 48912  bytes 34912044 (34.9 MB)
        TX packets 28912  bytes 12948112 (12.9 MB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)`
    },

    'netstat': {
      description: 'Print network connections, routing tables, and interface statistics',
      usage: 'netstat [-an]',
      execute: () => `Active Internet connections (servers and established)
Proto Recv-Q Send-Q Local Address           Foreign Address         State      
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN     
tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN     
tcp        0      0 127.0.0.1:3001          0.0.0.0:*               LISTEN     
tcp        0      0 192.168.1.105:54120     185.120.44.12:443       ESTABLISHED
udp        0      0 0.0.0.0:68              0.0.0.0:*                          `
    },

    'ps': {
      description: 'Report a snapshot of the current processes',
      usage: 'ps [aux]',
      execute: () => `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.1 169348 11420 ?        Ss   08:00   0:02 /sbin/init
shqipai      412  0.0  0.2  18452  8912 pts/0    Ss   08:15   0:00 -bash
shqipai      580  0.2  1.4 340120 48120 pts/0    Sl+  08:16   0:04 node server.js
shqipai      912  0.0  0.1  10420  3412 pts/0    R+   10:14   0:00 ps aux`
    }
  };

  // Aliases
  SIMULATED_COMMANDS['tracert'] = SIMULATED_COMMANDS['traceroute'];
  SIMULATED_COMMANDS['ip'] = { description: 'IP config', execute: () => SIMULATED_COMMANDS['ifconfig'].execute() };
  SIMULATED_COMMANDS['arp'] = { description: 'Address resolution table', execute: () => `Address                  HWtype  HWaddress           Flags Mask            Iface\n192.168.1.1              ether   c4:ea:1d:88:9f:12   C                     eth0\n192.168.1.100            ether   00:15:5d:22:44:88   C                     eth0` };

  // ----------------------------------------------------------------
  // 10 HANDS-ON CYBERSECURITY CTF CHALLENGES
  // ----------------------------------------------------------------
  const CHALLENGES = [
    {
      id: 1,
      title: '🔍 Hidden Service Discovery',
      description: 'A target server (192.168.1.100) has an unconventional proxy service running. Find the open ports and identify the proxy version.',
      difficulty: 'Easy',
      points: 100,
      hint: 'Run: nmap -sV 192.168.1.100',
      verify: (cmd, out) => cmd.includes('nmap') && (out.includes('8080') || out.includes('Squid'))
    },
    {
      id: 2,
      title: '📜 Secret Base64 Cipher',
      description: 'Decode the secret flag encoded in Base64: "U2hxaXBBSXtlZHVfY3liZXJfZGVmZW5kZXJfcHJvfQ=="',
      difficulty: 'Easy',
      points: 100,
      hint: 'Run: base64 -d U2hxaXBBSXtlZHVfY3liZXJfZGVmZW5kZXJfcHJvfQ==',
      verify: (cmd, out) => (cmd.includes('base64') && out.includes('ShqipAI{')) || out.includes('edu_cyber_defender_pro')
    },
    {
      id: 3,
      title: '🔐 Caesar / ROT13 Decryption',
      description: 'An intercepted spy transmission reads: "Synt{or_pnershy_jura_fhesvat_jvsv}". Decrypt the ciphertext.',
      difficulty: 'Easy',
      points: 120,
      hint: 'Run: rot13 Synt{or_pnershy_jura_fhesvat_jvsv}',
      verify: (cmd, out) => cmd.includes('rot13') || out.includes('be_careful_when_surfing_wifi')
    },
    {
      id: 4,
      title: '🌐 DNS Mail Server Reconnaissance',
      description: 'Find the primary Mail Exchange (MX) server for the school domain "school.edu.al".',
      difficulty: 'Medium',
      points: 150,
      hint: 'Run: dig school.edu.al MX',
      verify: (cmd, out) => (cmd.includes('dig') || cmd.includes('nslookup')) && out.includes('mail.school.edu.al')
    },
    {
      id: 5,
      title: '🛡️ SSL/TLS Certificate Verification',
      description: 'Inspect the SSL certificate chain and cipher suite of the remote server at "school.edu.al".',
      difficulty: 'Medium',
      points: 180,
      hint: 'Run: openssl s_client -connect school.edu.al:443',
      verify: (cmd, out) => cmd.includes('openssl') && (out.includes('TLSv1.3') || out.includes('Let\'s Encrypt'))
    },
    {
      id: 6,
      title: '💉 SQL Injection Vulnerability Analysis',
      description: 'Detect whether "http://school.edu.al/grades.php?id=1" is vulnerable to SQL injection.',
      difficulty: 'Hard',
      points: 250,
      hint: 'Run: sqlmap -u "http://school.edu.al/grades.php?id=1"',
      verify: (cmd, out) => cmd.includes('sqlmap') && (out.includes('boolean-based blind') || out.includes('time-based blind'))
    },
    {
      id: 7,
      title: '📂 Web Directory Fuzzing',
      description: 'Enumerate hidden folders and configuration backups on the target website.',
      difficulty: 'Medium',
      points: 200,
      hint: 'Run: gobuster dir -u http://portal.school.internal -w common.txt',
      verify: (cmd, out) => cmd.includes('gobuster') && (out.includes('/admin') || out.includes('/config.php.bak'))
    },
    {
      id: 8,
      title: '🕵️ Network Packet Sniffing',
      description: 'Capture active TCP handshakes and DNS lookups on network interface eth0.',
      difficulty: 'Medium',
      points: 200,
      hint: 'Run: tcpdump or wireshark',
      verify: (cmd, out) => (cmd.includes('tcpdump') || cmd.includes('wireshark')) && out.includes('IP')
    },
    {
      id: 9,
      title: '🔑 Password Hash Recovery',
      description: 'Recover a plaintext password from an intercepted MD5 or SHA hash.',
      difficulty: 'Hard',
      points: 250,
      hint: 'Run: john --wordlist=rockyou.txt hashes.txt or hashcat',
      verify: (cmd, out) => (cmd.includes('john') || cmd.includes('hashcat')) && (out.includes('Cracked') || out.includes('DONE'))
    },
    {
      id: 10,
      title: '⚡ SSH Brute Force Mitigation Test',
      description: 'Simulate an automated credential attack against an SSH server to test rate limiting.',
      difficulty: 'Hard',
      points: 300,
      hint: 'Run: hydra -l admin -P passlist.txt 192.168.1.100 ssh',
      verify: (cmd, out) => cmd.includes('hydra') && out.includes('valid password found')
    }
  ];

  // ----------------------------------------------------------------
  // PROCESS COMMAND
  // ----------------------------------------------------------------
  function processSimulatedCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (SIMULATED_COMMANDS[cmd]) {
      const handler = SIMULATED_COMMANDS[cmd];
      const output = typeof handler.execute === 'function' ? handler.execute(args) : handler.execute;

      // Check active challenge completions
      CHALLENGES.forEach(ch => {
        if (ch.verify && ch.verify(trimmed.toLowerCase(), String(output))) {
          if (window.Gamification && window.AppState?.gamification) {
            window.Gamification.awardPoints?.(ch.points, `CTF Challenge: ${ch.title}`);
          }
        }
      });

      return {
        output,
        simulated: true,
        description: handler.description
      };
    }

    return null;
  }

  function getHelp() {
    let help = '╔════════════════════════════════════════════════════════════════════════╗\n';
    help += '║         🛡️  EduAI Interactive Cybersecurity Linux Suite             ║\n';
    help += '╚════════════════════════════════════════════════════════════════════════╝\n\n';
    help += 'RECONNAISSANCE & SCANNING:\n';
    help += '  nmap <target> [-sV|-p-|-A]  - Port scanner & service version detector\n';
    help += '  ping <host>                 - ICMP latency probe\n';
    help += '  traceroute <host>           - Packet routing path\n';
    help += '  whois <domain>              - Domain ownership & DNSSEC\n';
    help += '  dig / nslookup <domain>     - DNS record interrogation\n';
    help += '  curl / wget <url> [-I]      - HTTP header & web retrieval\n\n';
    help += 'CRYPTOGRAPHY & CRACKING:\n';
    help += '  base64 [-d] <string>        - Base64 encoder/decoder\n';
    help += '  rot13 <text>                - Caesar substitution cipher\n';
    help += '  sha256sum / md5sum <text>   - Cryptographic digest computation\n';
    help += '  openssl [s_client|enc]      - TLS certificates & crypto\n';
    help += '  john / hydra / hashcat      - Ethical password security testing\n\n';
    help += 'WEB VULNERABILITY & ANALYSIS:\n';
    help += '  sqlmap -u <url>             - Automated SQL injection analysis\n';
    help += '  gobuster / dirb <url>       - Web directory & endpoint brute force\n';
    help += '  tcpdump / wireshark         - Network packet inspection\n\n';
    help += 'SYSTEM & CTF:\n';
    help += '  challenge                   - View 10 Hands-on CTF Challenges\n';
    help += '  uname -a / whoami / id      - System identification\n';
    help += '  ifconfig / netstat / ps     - Network interfaces & processes\n';
    help += '  clear / help / ls / cat     - Standard shell navigation\n';
    return help;
  }

  // ----------------------------------------------------------------
  // EXPORT
  // ----------------------------------------------------------------
  window.CyberChallenges = {
    processSimulatedCommand,
    getChallenge: (id) => CHALLENGES.find(c => c.id === parseInt(id)),
    getAllChallenges: () => CHALLENGES,
    getHelp,
    SIMULATED_COMMANDS,
    CHALLENGES
  };

  console.log('✅ EduAI High-Fidelity Cybersecurity Suite loaded');
})();
