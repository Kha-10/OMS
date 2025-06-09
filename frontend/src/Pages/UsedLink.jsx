import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, LogIn } from "lucide-react"

export default function UsedLink() {
  const [countdown, setCountdown] = useState(10)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown <= 1) {
          clearInterval(timer)
          navigate('/tenant/sign-in')
          return 0
        }
        return prevCountdown - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  const handleRedirect = () => {
    navigate('/tenant/sign-in')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-orange-600 text-center">Link Already Used</CardTitle>
          <CardDescription className="text-center">
            This password reset link has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center text-orange-500">
            <AlertCircle className="w-12 h-12" />
          </div>
          <p className="text-center text-gray-600">
            For security reasons, each password reset link can only be used once.
            If you still need to reset your password, please request a new link from the login page.
          </p>
          <div className="text-center text-sm text-gray-500">
            Redirecting to login page in {countdown} seconds...
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleRedirect}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}