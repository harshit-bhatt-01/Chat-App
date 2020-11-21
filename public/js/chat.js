var socket = io()

var $messageForm = document.querySelector('#message-form')
var $messageFormInput = $messageForm.querySelector('input')
var $messageFormButton = $messageForm.querySelector('button')
var $sendLocationButton = document.querySelector('#send-location')
var $messages = document.querySelector('#messages')

var messageTemplate = document.querySelector('#message-template').innerHTML
var locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
var sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

var { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

var autoScroll = () => {
    var $newMessage = $messages.lastElementChild

    var newMessageStyles = getComputedStyle($newMessage)
    var newMessageMargin = parseInt(newMessageStyles.marginBottom)
    var newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    var visibleHeight = $messages.offsetHeight

    var containerHeight = $messages.scrollHeight

    var scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight- newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('locationMessage', (message) => {
    var html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('message', (message) => {
    var html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    var html = Mustache.render(sidebarTemplate, {
        room, 
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')

    var message = $messageFormInput.value
    socket.emit('sendMessage', message, (message) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        console.log('Message Delivered!', message)
    })
})

$sendLocationButton.addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser. Update the browser and try again.')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        var data = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        socket.emit('sendLocation', data, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})