"use client"

import { createContext, useState, useContext, useEffect } from "react"

// Create context
const SettingsContext = createContext()

export const useSettings = () => useContext(SettingsContext)

export const SettingsProvider = ({ children }) => {
  // Load settings from localStorage or use defaults
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("explosiveChess_soundEnabled")
    return saved !== null ? JSON.parse(saved) : true
  })

  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem("explosiveChess_musicEnabled")
    return saved !== null ? JSON.parse(saved) : false
  })

  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    const saved = localStorage.getItem("explosiveChess_animationsEnabled")
    return saved !== null ? JSON.parse(saved) : true
  })

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("explosiveChess_theme")
    return saved || "dark"
  })

  const [showCoordinates, setShowCoordinates] = useState(() => {
    const saved = localStorage.getItem("explosiveChess_showCoordinates")
    return saved !== null ? JSON.parse(saved) : true
  })

  const [showMoveHistory, setShowMoveHistory] = useState(() => {
    const saved = localStorage.getItem("explosiveChess_showMoveHistory")
    return saved !== null ? JSON.parse(saved) : true
  })

  const [showCapturedPieces, setShowCapturedPieces] = useState(() => {
    const saved = localStorage.getItem("explosiveChess_showCapturedPieces")
    return saved !== null ? JSON.parse(saved) : true
  })

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("explosiveChess_volume")
    return saved !== null ? Number.parseInt(saved) : 50
  })

  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem("explosiveChess_musicVolume")
    return saved !== null ? Number.parseInt(saved) : 30
  })

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem("explosiveChess_soundEnabled", JSON.stringify(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem("explosiveChess_musicEnabled", JSON.stringify(musicEnabled))
  }, [musicEnabled])

  useEffect(() => {
    localStorage.setItem("explosiveChess_animationsEnabled", JSON.stringify(animationsEnabled))
  }, [animationsEnabled])

  useEffect(() => {
    localStorage.setItem("explosiveChess_theme", theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem("explosiveChess_showCoordinates", JSON.stringify(showCoordinates))
  }, [showCoordinates])

  useEffect(() => {
    localStorage.setItem("explosiveChess_showMoveHistory", JSON.stringify(showMoveHistory))
  }, [showMoveHistory])

  useEffect(() => {
    localStorage.setItem("explosiveChess_showCapturedPieces", JSON.stringify(showCapturedPieces))
  }, [showCapturedPieces])

  useEffect(() => {
    localStorage.setItem("explosiveChess_volume", volume.toString())
  }, [volume])

  useEffect(() => {
    localStorage.setItem("explosiveChess_musicVolume", musicVolume.toString())
  }, [musicVolume])

  // Audio handling
  const playSound = (soundType) => {
    if (!soundEnabled) return

    // In a real implementation, this would play actual sound files
    console.log(`Playing sound: ${soundType} at volume ${volume}`)

    // Simulate sound with browser API if available
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      // Set volume
      gainNode.gain.value = volume / 100

      // Set frequency based on sound type
      switch (soundType) {
        case "move":
          oscillator.frequency.value = 440 // A4
          oscillator.type = "sine"
          break
        case "capture":
          oscillator.frequency.value = 330 // E4
          oscillator.type = "triangle"
          break
        case "explosion":
          oscillator.frequency.value = 220 // A3
          oscillator.type = "sawtooth"
          break
        case "check":
          oscillator.frequency.value = 880 // A5
          oscillator.type = "square"
          break
        case "gameOver":
          oscillator.frequency.value = 660 // E5
          oscillator.type = "triangle"
          break
        case "click":
          oscillator.frequency.value = 1320 // E6
          oscillator.type = "sine"
          break
        default:
          oscillator.frequency.value = 440 // A4
          oscillator.type = "sine"
      }

      // Start and stop the sound
      oscillator.start()
      setTimeout(
        () => {
          oscillator.stop()
        },
        soundType === "explosion" ? 500 : soundType === "gameOver" ? 1000 : 100,
      )
    } catch (error) {
      console.log("Audio not supported")
    }
  }

  // Get board colors based on theme
  const getBoardColors = () => {
    switch (theme) {
      case "classic":
        return {
          light: "#f0d9b5",
          dark: "#b58863",
          selected: "#bac7ff",
          validMove: "rgba(76, 175, 80, 0.5)",
          check: "#ff6b6b",
        }
      case "modern":
        return {
          light: "#e8edf9",
          dark: "#b7c0d8",
          selected: "#78a9ff",
          validMove: "rgba(80, 200, 120, 0.6)",
          check: "#ff7a7a",
        }
      case "dark":
        return {
          light: "#525252",
          dark: "#333333",
          selected: "#3d5afe",
          validMove: "rgba(76, 175, 80, 0.5)",
          check: "#ff5252",
        }
      case "neon":
        return {
          light: "#2d2d2d",
          dark: "#1a1a1a",
          selected: "#00ff9c",
          validMove: "rgba(0, 255, 255, 0.5)",
          check: "#ff00ff",
        }
      default:
        return {
          light: "#f0d9b5",
          dark: "#b58863",
          selected: "#bac7ff",
          validMove: "rgba(76, 175, 80, 0.5)",
          check: "#ff6b6b",
        }
    }
  }

  // Reset settings to defaults
  const resetSettings = () => {
    setSoundEnabled(true)
    setMusicEnabled(false)
    setAnimationsEnabled(true)
    setTheme("dark")
    setShowCoordinates(true)
    setShowMoveHistory(true)
    setShowCapturedPieces(true)
    setVolume(50)
    setMusicVolume(30)
  }

  return (
    <SettingsContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        musicEnabled,
        setMusicEnabled,
        animationsEnabled,
        setAnimationsEnabled,
        theme,
        setTheme,
        showCoordinates,
        setShowCoordinates,
        showMoveHistory,
        setShowMoveHistory,
        showCapturedPieces,
        setShowCapturedPieces,
        volume,
        setVolume,
        musicVolume,
        setMusicVolume,
        playSound,
        getBoardColors,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
