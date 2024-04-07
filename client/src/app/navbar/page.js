'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // corrected import
import { useSocket } from '../hook/page';
import '../CSS/Navbar.css';


function Navbar() {

  const router = useRouter();
  const socket = useSocket();
  const [socketConnected, setSocketConnected] = useState(false);
  const [Role , setRole] = useState(null);


  useEffect(() =>{

    if(socket){

      socket.on('connect', () => {
        console.log("socket connected successfully");
        setSocketConnected(true);
      });

    }
  },[socket])

  const handleClick = () => {
    console.log("button")
    if (socketConnected) {
      socket.emit('Generate Room');
      socket.on('role' , (role) => {
        console.log(role);
        setRole(role);
        localStorage.setItem('role' , role);
      })
      socket.on('roomID', (roomId) => {
        console.log(roomId);
        if(roomId){
          router.push(`/room/${roomId}` , {query : {'Role' : Role}});
        }
      });
    } else {
      console.error('Socket is not connected yet.');
    }
    console.log(socket);
  };

  return (
    <nav className='nav'>
      <ul className="ul">
        <li className="li"><Link href="/">HOME</Link></li>
        <li className="li"><Link href="/creator">CREATOR</Link></li>
        <li className="li"><Link href="/event">EVENTS</Link></li>
        <li className="li"><Link href="/about">ABOUT</Link></li>
      </ul>
      <ul className='Rightul ul'>
        <li className="li revli" onClick={handleClick}>
          <button className="join">Join Now</button>
        </li>
        <li className="li intrevli revli">
          <img className="vaultimg inter" src="./InteractionCoin.svg" alt="" />
          <p className="interaction">10</p>
        </li>
        <li className="li revli">
          <img className="vaultimg" src="./vault.svg" alt="" />
        </li>
        <div className="imgbg">
          <img src="/vector.svg" alt="Account" />
        </div>
      </ul>
    </nav>
  );
};
export default Navbar;
