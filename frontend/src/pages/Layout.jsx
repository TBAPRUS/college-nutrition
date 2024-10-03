import React from 'react'
import { Outlet } from "react-router-dom";
import Header from '../components/Header'
import './Layout.css'

export default function Layout({ children }) {
  return (
    <div>
      <Header />
      <main>
        { children }
      </main>
    </div>
  )
}