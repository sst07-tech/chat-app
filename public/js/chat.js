// Connect to server using WebSockets.
const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form') 
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')


// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    console.log(newMessageStyles);
    
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    console.log(newMessageMargin);
    
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
    console.log(newMessageHeight);
    
    // Visible Height
    const visibleHeight = $messages.offsetHeight;

    // Height of messages container
    const containerHeight = $messages.scrollHeight;

    // How far I have scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if((containerHeight - newMessageHeight) <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight;
    }
}

// socket.on('countUpdated', (count) => {
//     console.log('The count has been updated ', count);
    
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Clicked');
//     socket.emit('increment');
// })

socket.on('message', (welMessage) => {
    console.log('Hey, ',welMessage);
    const html = Mustache.render(messageTemplate, {
        username: welMessage.username,
        message: welMessage.text,
        createdAt: moment(welMessage.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage);
    
    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

document.querySelector('#message-form').addEventListener('submit', (e) => {
    e.preventDefault();

    //Disable the button once the message is sent
    $messageFormButton.setAttribute('disabled','disabled');
    // const message = document.querySelector('input').value;
    const message = e.target.elements.message.value;
    socket.emit('sendMessage',message, (error) => {
        //enable the button once the message is delivered to server
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
        if(error){
            return console.log(error);
        }
        console.log('Message delivered!');
        
    });
})

$sendLocationButton.addEventListener('click', () => {

    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    //Disable the button once the location is sent
    $sendLocationButton.setAttribute('disabled','disabled');

    navigator.geolocation.getCurrentPosition(function(position) {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location Shared!');

            // Enable the send location button once the acknowledgement is done
            $sendLocationButton.removeAttribute('disabled');
        })
        
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error){
        alert(error);
        location.href = '/'
    }
});