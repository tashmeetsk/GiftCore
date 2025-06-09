"use client"

import { useEffect, useRef } from "react"

export default function BackgroundGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawGradient = (time: number) => {
      if (!ctx || !canvas) return

      // Create a dark base
      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Create animated gradient overlay
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.5 + Math.cos(time * 0.001) * 200,
        canvas.height * 0.3 + Math.sin(time * 0.0008) * 100,
        0,
        canvas.width * 0.5,
        canvas.height * 0.3,
        Math.max(canvas.width, canvas.height) * 0.8,
      )

      gradient.addColorStop(0, "rgba(0, 100, 150, 0.3)")
      gradient.addColorStop(0.3, "rgba(0, 150, 100, 0.2)")
      gradient.addColorStop(0.6, "rgba(50, 0, 100, 0.1)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add second gradient for more depth
      const gradient2 = ctx.createRadialGradient(
        canvas.width * 0.8 + Math.sin(time * 0.0012) * 150,
        canvas.height * 0.7 + Math.cos(time * 0.001) * 100,
        0,
        canvas.width * 0.8,
        canvas.height * 0.7,
        Math.max(canvas.width, canvas.height) * 0.6,
      )

      gradient2.addColorStop(0, "rgba(100, 0, 150, 0.2)")
      gradient2.addColorStop(0.4, "rgba(0, 100, 200, 0.15)")
      gradient2.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.globalCompositeOperation = "screen"
      ctx.fillStyle = gradient2
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = "source-over"

      animationId = requestAnimationFrame(drawGradient)
    }

    resizeCanvas()
    drawGradient(0)

    const resizeHandler = () => {
      resizeCanvas()
    }

    window.addEventListener("resize", resizeHandler)

    return () => {
      window.removeEventListener("resize", resizeHandler)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />
}
