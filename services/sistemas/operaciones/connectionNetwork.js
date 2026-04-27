const net = require('net');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const connectionNetworkService = {
    testICMP: async (ip) => {
        const comando = process.platform === 'win32' ? `ping -n 1 ${ip}` : `ping -c 1 ${ip}`;
        try {
            await execPromise(comando);
            return 'OK';
        } catch {
            return 'FALLIDA';
        }
    },
    testPort: async (ip, puerto) => {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1500);
            socket.on('connect', () => { socket.destroy(); resolve('ABIERTO'); });
            socket.on('timeout', () => { socket.destroy(); resolve('CERRADO (TIMEOUT)'); });
            socket.on('error', () => { socket.destroy(); resolve('CERRADO'); });
            socket.connect(puerto, ip);
        });
    },
};

module.exports = connectionNetworkService;