import {Client} from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import React, {useEffect, useRef, useState} from "react";
import {Button, Modal, ModalBody, ModalFooter} from 'reactstrap';
import axios from "axios";


function App() {
    const [messages, setMessages] = useState([]);
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [tempUsername, setTempUsername] = useState();
    const [text, setText] = useState();
    const stompClientRef = useRef(null);

    useEffect(() => {
            axios.get("http://localhost:8080/messages")
                .then(res => setMessages(res.data))
            const stompClient = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                onConnect: () => {
                    stompClient.subscribe('/topic/410', (response) => {
                        const newMessage = JSON.parse(response.body);
                        setMessages(prevMessages => [...prevMessages, newMessage]);
                    });
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                }
            });
            stompClient.activate();
            console.log(stompClient)
            stompClientRef.current = stompClient;
            return () => {
                stompClient.deactivate().then();
            };
        },
        [])

    console.log(messages)

    const sendMess = () => {
        console.log(text)
        const stomp = stompClientRef.current;
        const body = {
            text,
            sender: username
        };

        console.log(body)
        stomp.publish({
            destination: '/app/xabar',
            body: JSON.stringify(body)
        })
    }

    const closeModal = () => {
        localStorage.setItem("username", tempUsername)
        setUsername(tempUsername);
    }

    return (
        <>
            {username && <>
                <h1>Welcome to chat of 410: {username}</h1>
                {messages.map(message => <div key={message.id}>
                    <p>{message.sender} : {message.text} : {message.createdAt}</p>
                    <br/>
                </div>)}
                <input type="text" onChange={(e) => {
                    setText(e.target.value)
                }}/>
                <button onClick={sendMess}>Send</button>
            </>}

            <Modal isOpen={!username}>
                <ModalBody>
                    <input type="text"
                           placeholder={"Enter username"}
                           onChange={(e) => setTempUsername(e.target.value)}/>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={closeModal}>
                        Save
                    </Button>
                </ModalFooter>
            </Modal>
        </>

    );
}

export default App;
