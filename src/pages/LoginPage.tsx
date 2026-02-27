import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (login && password) onLogin()
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-10 flex flex-col items-center gap-7 animate-slide-up shadow-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-2xl overflow-hidden">
            <img src="/assets/app-icon.png" alt="MusicLab" className="w-full h-full object-cover" />
          </div>
          <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 font-display">
            MUSICLAB
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <Input
            type="text"
            placeholder="Логин"
            value={login}
            onChange={e => setLogin(e.target.value)}
            autoComplete="username"
            className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-violet-500 text-gray-700 placeholder:text-gray-300 transition-colors bg-transparent"
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            className="border-0 border-b border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-violet-500 text-gray-700 placeholder:text-gray-300 transition-colors bg-transparent"
          />
          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-200 hover:-translate-y-0.5"
            >
              Войти
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full border-gray-200 text-gray-500 hover:border-violet-400 hover:text-violet-600 rounded-lg"
            >
              Зарегистрироваться
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
