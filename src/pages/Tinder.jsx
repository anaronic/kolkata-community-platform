import React, { useState, useRef, useEffect } from 'react'
import { FaHeart, FaTimes, FaStar } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

const DESCRIPTION_LIMIT = 180;

function Tinder() {
  const { token, logout } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
  const [showFeedback, setShowFeedback] = useState(false)
  const [showFeedbackInput, setShowFeedbackInput] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [pendingSwipe, setPendingSwipe] = useState(null)
  const [cardVisible, setCardVisible] = useState(true)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [userStars, setUserStars] = useState(3);
  const cardRef = useRef(null)

  useEffect(() => {
    async function fetchProfiles() {
      try {
        setLoading(true)
        const res = await fetch('/api/tinder-profiles')
        if (!res.ok) throw new Error('Failed to fetch profiles')
        const data = await res.json()
        setProfiles(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProfiles()
  }, [])

  // Animate card entrance
  useEffect(() => {
    setCardVisible(true)
    if (cardRef.current) {
      cardRef.current.style.transition = 'none'
      cardRef.current.style.transform = 'scale(0.95) translateY(40px)'
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = 'transform 0.4s cubic-bezier(.22,1,.36,1)'
          cardRef.current.style.transform = 'scale(1) translateY(0)'
        }
      }, 30)
    }
    setShowFeedbackInput(false)
    setFeedbackText('')
  }, [currentIndex])

  // Mouse events
  const handleMouseDown = (e) => {
    setDrag({ ...drag, isDragging: true, startX: e.clientX, startY: e.clientY })
    document.body.style.userSelect = 'none'
  }
  const handleMouseMove = (e) => {
    if (!drag.isDragging) return
    const dx = e.clientX - drag.startX
    setDrag((d) => ({ ...d, x: dx }))
    if (cardRef.current) {
      cardRef.current.style.transition = 'none'
      cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.1}deg)`
    }
  }
  const handleMouseUp = () => {
    if (!drag.isDragging) return
    const threshold = window.innerWidth * 0.25
    if (Math.abs(drag.x) > threshold) {
      const direction = drag.x > 0 ? 1 : -1
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s ease'
        cardRef.current.style.transform = `translateX(${direction * 500}px) rotate(${direction * 30}deg)`
      }
      setTimeout(() => {
        setCardVisible(false)
        setTimeout(() => {
          setPendingSwipe({ direction })
          setShowFeedback(true)
          setDrag({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
          if (cardRef.current) cardRef.current.style.transform = 'none'
        }, 300) // increased for smoother animation
      }, 300)
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s cubic-bezier(.22,1,.36,1)'
        cardRef.current.style.transform = 'none'
      }
      setDrag({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
    }
  }
  // Touch events
  const handleTouchStart = (e) => {
    setDrag({ ...drag, isDragging: true, startX: e.touches[0].clientX, startY: e.touches[0].clientY })
  }
  const handleTouchMove = (e) => {
    if (!drag.isDragging) return
    const dx = e.touches[0].clientX - drag.startX
    setDrag((d) => ({ ...d, x: dx }))
    if (cardRef.current) {
      cardRef.current.style.transition = 'none'
      cardRef.current.style.transform = `translateX(${dx}px) rotate(${dx * 0.1}deg)`
    }
  }
  const handleTouchEnd = () => {
    const threshold = window.innerWidth * 0.25
    if (Math.abs(drag.x) > threshold) {
      const direction = drag.x > 0 ? 1 : -1
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s ease'
        cardRef.current.style.transform = `translateX(${direction * 500}px) rotate(${direction * 30}deg)`
      }
      setTimeout(() => {
        setCardVisible(false)
        setTimeout(() => {
          setPendingSwipe({ direction })
          setShowFeedback(true)
          setDrag({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
          if (cardRef.current) cardRef.current.style.transform = 'none'
        }, 100)
      }, 300)
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = 'transform 0.3s cubic-bezier(.22,1,.36,1)'
        cardRef.current.style.transform = 'none'
      }
      setDrag({ x: 0, y: 0, isDragging: false, startX: 0, startY: 0 })
    }
  }

  // Handler to move to next card after feedback
  const handleFeedbackDone = async () => {
    setShowFeedback(false)
    setShowFeedbackInput(false)
    setPendingSwipe(null)
    setCardVisible(true)
    if (profiles[currentIndex]) {
      // Send feedback to backend
      try {
        const res = await fetch(`/api/tinder-profiles/${profiles[currentIndex]._id}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            swipeDirection: pendingSwipe?.direction === 1 ? 'right' : 'left',
            feedbackText: feedbackText,
            userStars: userStars
          })
        })
        if (res.status === 401) { logout(); return }
      } catch (e) {
        // Optionally handle error
      }
    }
    setFeedbackText('')
    setUserStars(3)
    setCurrentIndex((prev) => (prev + 1) % profiles.length)
    // Always reset card transform after feedback
    if (cardRef.current) {
      cardRef.current.style.transform = 'none'
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
  if (!profiles.length) return <div className="min-h-screen flex items-center justify-center">No profiles found.</div>
  if (currentIndex >= profiles.length) {
    return (
      <div className="min-h-screen flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No more profiles!</h2>
          <button
            onClick={() => setCurrentIndex(0)}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  const profile = profiles[currentIndex]
  const isDescriptionLong = profile.bio.length > DESCRIPTION_LIMIT;
  const shortDescription = isDescriptionLong ? profile.bio.slice(0, DESCRIPTION_LIMIT) + '...' : profile.bio;

  // Edge glow logic
  const glowStrength = Math.min(Math.abs(drag.x) / (window.innerWidth * 0.25), 1)
  const showLeftGlow = drag.x < -30 && drag.isDragging
  const showRightGlow = drag.x > 30 && drag.isDragging

  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-1 items-center justify-center overflow-hidden pb-24 bg-inherit z-0" style={{paddingTop: '64px', minHeight: '0', height: 'calc(100vh - 0px)'}}>
      {/* Edge Glows */}
      {showLeftGlow && !showFeedback && (
        <div className="pointer-events-none fixed left-0 top-0 h-full w-1/3 z-40" style={{background: `radial-gradient(circle at left, rgba(239,68,68,${0.3 * glowStrength}) 0%, transparent 80%)`}}></div>
      )}
      {showRightGlow && !showFeedback && (
        <div className="pointer-events-none fixed right-0 top-0 h-full w-1/3 z-40" style={{background: `radial-gradient(circle at right, rgba(34,197,94,${0.3 * glowStrength}) 0%, transparent 80%)`}}></div>
      )}
      {/* Card - only show when feedback popup is not visible and cardVisible is true */}
      {!showFeedback && cardVisible && (
        <div
          ref={cardRef}
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[350px] h-[520px] max-w-full mx-auto p-0 select-none cursor-grab z-50 flex flex-col items-center overflow-hidden"
          style={{ touchAction: 'pan-y', minHeight: '520px', maxHeight: '520px', minWidth: '350px', maxWidth: '350px', display: 'flex', flexDirection: 'column' }}
          onMouseDown={handleMouseDown}
          onMouseMove={drag.isDragging ? handleMouseMove : undefined}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={profile.image}
            alt={profile.name}
            className="w-full h-56 object-cover rounded-t-2xl"
            style={{ minHeight: '224px', maxHeight: '224px' }}
          />
          <div className="flex-1 flex flex-col justify-center items-center w-full px-5 pb-5 min-h-[180px]">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white text-center w-full">
              {profile.name}, <span className="text-orange-600">{profile.age}</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-left w-full overflow-hidden text-ellipsis" style={{display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical'}}>
              {shortDescription}
              {isDescriptionLong && (
                <span className="text-blue-500 cursor-pointer ml-1 hover:underline" onClick={() => setShowFullDescription(true)}>
                  Read more
                </span>
              )}
            </p>
          </div>
          {/* Display base star rating if available */}
          {typeof profile.baseStars === 'number' && (
            <div className="mt-2 text-xs text-gray-400 text-center">
              External Rating: <span className="font-bold text-blue-600">{profile.baseStars.toFixed(1)}/5</span>
            </div>
          )}
          {/* Display app star rating if available */}
          {typeof profile.averageStars === 'number' && (
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-300 text-center">
              App Rating: <span className="font-bold text-orange-600">{profile.averageStars.toFixed(1)}/5</span>
            </div>
          )}
        </div>
      )}
      {/* Full Description Modal */}
      {showFullDescription && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 animate-fadein">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full text-center animate-fadein">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{profile.name}, <span className="text-orange-600">{profile.age}</span></h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4 whitespace-pre-line text-left">{profile.bio}</p>
            <button className="mt-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700" onClick={() => setShowFullDescription(false)}>
              Close
            </button>
          </div>
        </div>
      )}
      {/* Feedback Popup */}
      {showFeedback && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 animate-fadein">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full text-center animate-fadein">
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Feedback</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">How was your experience?</p>
            {/* Star rating input */}
            <div className="flex justify-center mb-4">
              {[1,2,3,4,5].map(star => (
                <FaStar
                  key={star}
                  size={28}
                  className={
                    star <= userStars
                      ? 'text-orange-500 cursor-pointer'
                      : 'text-gray-300 cursor-pointer'
                  }
                  onClick={() => setUserStars(star)}
                  data-testid={`star-${star}`}
                />
              ))}
            </div>
            <textarea
              className="w-full p-3 rounded-lg border text-base dark:bg-gray-700 dark:text-white mb-4"
              rows={3}
              placeholder="Share your thoughts..."
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
            />
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                onClick={handleFeedbackDone}
              >
                Submit
              </button>
              <button
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-700"
                onClick={() => { setShowFeedback(false); setShowFeedbackInput(false); setFeedbackText(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tinder
