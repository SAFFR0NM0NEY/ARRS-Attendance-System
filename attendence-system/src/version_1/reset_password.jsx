import {useState} from 'react'
import supabase from '../supabase'

export default function ResetPasswordPage() {
  const [Password, setPassword] = useState('')
  const [ConfirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [success, setSuccess] = useState(null)

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    if (Password !== ConfirmPassword){
      setErrorMessage('Passwords Do Not Match')
      setLoading(false)
      return
    }

    if(Password.length < 6) {
      setErrorMessage('Password Must Be At Least 6 Characters Long')
      setLoading(false)
      return
    }

    const {error} = await supabase.auth.updateUser({
      password: Password
    })

    if(error){
      setErrorMessage(error.message)
      setLoading(false)
    }
    else {
      setSuccess('Password set successfully! Redirecting to the home page.')
      setTimeout(() => {
        window.location.href('/')
      }, 2000)
    }
  }

  return (
    <div>
      <h2>Set Your Password</h2>
      <p>Please enter a secure password to complete your account setup.</p>

      <form onSubmit={handlePasswordUpdate}>
        <div>
          <label>New Password: </label>
          <input
            type='password'
            value={Password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder='••••••••••••••'
          />
        </div>
        <div>
          <label>Confirm Password: </label>
          <input 
            type='password'
            value={ConfirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder='••••••••••••••'
          />
        </div>
        <button type='submit' disabled={loading}>
          {loading ? 'Saving Password' : 'Save and Return'}
        </button>
      </form>

      {errorMessage && (<p style={{color: 'red', marginTop: '1rem'}}>{errorMessage}</p>)}
      {success && (<p style={{color: 'green', marginTop: '1rem'}}>{success}</p>)}
    </div>
  )
}