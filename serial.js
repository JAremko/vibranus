let port;
let writer;

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    if ("serial" in navigator) {
        setupConnectButton();
    } else {
        displayNotSupportedError();
    }
}

function setupConnectButton() {
    const connectContainer = document.getElementById('connectContainer');
    connectContainer.innerHTML = '<button id="connect" class="button is-link">Connect to Serial Device</button>';
    document.getElementById('connect').addEventListener('click', connectSerial);
}

function displayNotSupportedError() {
    const connectContainer = document.getElementById('connectContainer');
    connectContainer.innerHTML = '<div class="notification is-danger">Web Serial API is not supported in this browser. ' +
                                 'Please check <a href="https://caniuse.com/web-serial" target="_blank">browser compatibility</a>.</div>';
}

async function startReading() {
    const reader = port.readable.getReader();
    const textDecoder = new TextDecoder();

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                console.log('Stream closed');
                break;
            }
            console.log('Received:', textDecoder.decode(value));
        }
    } catch (error) {
        console.error('Error reading from serial port:', error);
    } finally {
        reader.releaseLock();
    }
}

async function connectSerial() {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 38400, flowControl: "hardware" });
        writer = port.writable.getWriter();
        console.log('Connected to the serial port');
        document.getElementById('connect').style.display = 'none';
        enableSlidersAndInputs();
        startReading();
    } catch (err) {
        console.error('There was an error opening the serial port:', err);
    }
}

function enableSlidersAndInputs() {
    const sliders = document.querySelectorAll('input[type=range]');
    const inputs = document.querySelectorAll('input[type=number]');

    sliders.forEach(slider => {
        slider.disabled = false;

        slider.addEventListener('input', () => {
            const matchingInput = document.getElementById(slider.id.replace('Slider', ''));
            if (matchingInput) matchingInput.value = slider.value;
            sendSliderValue(slider.id, slider.value);
        });
    });

    inputs.forEach(input => {
        input.disabled = false;

        input.addEventListener('input', () => {
            const matchingSlider = document.getElementById(input.id + 'Slider');
            if (matchingSlider) matchingSlider.value = input.value;
            sendSliderValue(input.id, input.value);
        });
    });
}

async function sendSliderValue(instruction, value) {
    if (writer) {
        const instructionWithoutSlider = instruction.replace('Slider', '');

        const message = `${instructionWithoutSlider}:${value}\0`;
        let encoder = new TextEncoder();
        let encodedMessage = encoder.encode(message);

        if (encodedMessage.length > 19) {
            console.error('Message is too long, it needs to be shorter than 20 bytes including null padding.');
            return;
        }

        let payload = new Uint8Array(20);
        payload.set(encodedMessage);

        console.log('Sending message: ', message);

        await writer.write(payload);

        console.log('Payload sent:', payload);
    } else {
        console.error('Serial port not connected or writer not set up.');
    }
}
