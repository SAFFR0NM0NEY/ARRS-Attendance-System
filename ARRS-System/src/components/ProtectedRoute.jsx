import { Navigate, useLocation } from "react-router-dom";
import {useEffect, useState} from 'react'
import {supabase} from '../supabase'

export default function ProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const location = useLocation();

  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [accountLoading, setAccountLoading] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [accountError, setAccountError] = useState(null)

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({data: {session},error}) => {
      if(!active) return;

      if(error){
        setAuthError(error.message)
      }
      else {
        setSession(session);
      }

      setAuthLoading(false);
    })

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setAuthError(null)
      setAuthLoading(false)
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [])

  useEffect(() => {
    let active = true;

    if(!session){
      setRole(null)
      setAccountError(null)
      setAccountLoading(false);
      return () => {
        active = false
      }
    }

    async function loadRole() {
      setAccountLoading(true)
      setAccountError(null)

      const {data: profile, error} = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if(!active) return;

      if(error){
        setRole(null)
        setAccountError(error.message)
      }
      else {
        setRole(profile.role)
      }

      setAccountLoading(false)
    }

    loadRole();

    return () => {
      active = false;
    }
  }, [session])

  if(authLoading || (session && accountLoading)){
    return console.log('Checking access...')
  }

  if(authError){
    return console.log(`Could not check your session: ${authError}`)
  }
  // If no one is logged in, send the visitor to the login page.
  if (!session) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if(accountError){
    return console.log(`Could not load profile role: ${accountError}`)
  }

  if(!role){
    return console.log(`No role allocated to this account`)
  }
  
  // Only allow the role assigned to this route.
  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to={`/${role}/dashboard`}
        replace
      />
    );
  }

  return children;
}
