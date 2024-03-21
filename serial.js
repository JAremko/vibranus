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

async function connectSerial() {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 38400 });
        writer = port.writable.getWriter();
        console.log('Connected to the serial port');
        document.getElementById('connect').style.display = 'none'; // Hide connect button
        enableSlidersAndInputs(); // Enable sliders and inputs
    } catch (err) {
        console.error('There was an error opening the serial port: ', err);
    }
}

function enableSlidersAndInputs() {
    const sliders = document.querySelectorAll('input[type=range]');
    const inputs = document.querySelectorAll('input[type=number]');

    sliders.forEach((slider, index) => {
        slider.disabled = false;

        // Add event listeners for slider events
        ['input', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
            slider.addEventListener(eventType, () => {
                inputs[index].value = slider.value;
                sendSliderValue(getSliderIndex(slider.id), slider.value);
            });
        });
    });

    inputs.forEach((input, index) => {
        input.disabled = false;

        // Add event listeners for input events
        ['input', 'change', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
            input.addEventListener(eventType, () => {
                sliders[index].value = input.value;
                sendSliderValue(getSliderIndex(input.id), input.value);
            });
        });
    });
}

function getSliderIndex(sliderId) {
    switch (sliderId) {
        case "sliderVcom": return 0;
        case "sliderBrightnessDisplay": return 1;
        case "sliderContrastDisplay": return 2;
        case "sliderBrightnessAdv": return 3;
        case "sliderContrastAdv": return 4;
        case "sliderHue": return 5;
        default: return -1; // Invalid index
    }
}

async function sendSliderValue(index, value) {
    if (writer && index !== -1) {
        const byteArray = [index, parseInt(value), 255];
        await writer.write(new Uint8Array(byteArray));
        console.log('Slider value sent:', byteArray);
    } else {
        console.error('Serial port not connected, writer not set up, or invalid index.');
    }
}
