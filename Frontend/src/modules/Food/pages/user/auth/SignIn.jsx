import { useState, useEffect, useRef } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { AlertCircle, Loader2, ArrowRight, ShieldCheck } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Input } from "@food/components/ui/input"
import { authAPI } from "@food/api"
import { motion, AnimatePresence } from "framer-motion"
import logoImg from "@food/assets/switcheats-logo copy.png"
import { getCachedSettings, loadBusinessSettings } from "@food/utils/businessSettings"

const debugError = (...args) => { }

export default function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [logoUrl, setLogoUrl] = useState(() => {
    const cached = getCachedSettings()
    return cached?.logo?.url || logoImg
  })
  const [companyName, setCompanyName] = useState(() => {
    const cached = getCachedSettings()
    return cached?.companyName || "Eatiefy"
  })

  const [formData, setFormData] = useState({
    phone: "",
    countryCode: "+91",
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await loadBusinessSettings()
        if (settings) {
          if (settings.logo?.url) setLogoUrl(settings.logo.url)
          if (settings.companyName) setCompanyName(settings.companyName)
        }
      } catch (err) {
        debugError("Error loading business settings:", err)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem("userAuthData")
    if (!stored) return

    try {
      const data = JSON.parse(stored)
      const fullPhone = String(data.phone || "").trim()
      const phoneDigits = fullPhone.replace(/^\+91\s*/, "").replace(/\D/g, "").slice(0, 10)

      setFormData((prev) => ({
        ...prev,
        phone: phoneDigits || prev.phone,
      }))
    } catch (err) {
      debugError("Error parsing stored auth data:", err)
    }
  }, [])

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Phone number is required"
    const cleanPhone = phone.replace(/\D/g, "")
    if (!/^\d{10}$/.test(cleanPhone)) return "Phone number must be 10 digits"
    return ""
  }

  const handleChange = (e) => {
    const { name } = e.target
    let { value } = e.target

    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10)
      setError(validatePhone(value))
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const phoneError = validatePhone(formData.phone)
    setError(phoneError)
    if (phoneError) return
    if (submittingRef.current) return
    submittingRef.current = true
    setIsLoading(true)
    setError("")

    try {
      const countryCode = formData.countryCode?.trim() || "+91"
      const phoneDigits = String(formData.phone ?? "").replace(/\D/g, "").slice(0, 10)
      if (phoneDigits.length !== 10) {
        setError("Phone number must be 10 digits")
        setIsLoading(false)
        submittingRef.current = false
        return
      }
      const fullPhone = `${countryCode} ${phoneDigits}`
      await authAPI.sendOTP(fullPhone, "login", null)

      const ref = String(searchParams.get("ref") || "").trim()
      const authData = {
        method: "phone",
        phone: fullPhone,
        email: null,
        name: null,
        referralCode: ref || null,
        isSignUp: false,
        module: "user",
      }

      sessionStorage.setItem("userAuthData", JSON.stringify(authData))
      navigate("/food/user/auth/otp")
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.error ||
        "Failed to send OTP. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  const isValidPhone = formData.phone.length === 10

  return (
    <AnimatedPage className="min-h-[100dvh] bg-white dark:bg-[#0A0A0B] flex flex-col font-sans overflow-hidden select-none">
      {/* Top Branding Section */}
      <div
        className="relative h-[40dvh] min-h-[250px] w-full overflow-hidden flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #659116 0%, #588114 100%)",
        }}
      >
        {/* Subtle Decorative Curves */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-30%] right-[-20%] w-[320px] h-[320px] border border-white rounded-full" />
          <div className="absolute bottom-[-20%] left-[-15%] w-[260px] h-[260px] border border-white rounded-full" />
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center gap-3 text-center"
        >
          <div className="w-22 h-22 sm:w-24 sm:h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-white/20 overflow-hidden p-2">
            <img
              src={logoUrl || logoImg}
              alt="Logo"
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              onError={(e) => {
                if (e.target.src !== logoImg) {
                  e.target.src = logoImg
                }
              }}
            />
          </div>
          <div className="text-center">
            <h1 className="text-white font-extrabold text-3xl sm:text-4xl tracking-tight leading-none mb-1">
              {companyName || "Eatiefy"}
            </h1>
            <p className="text-white/90 text-xs font-black uppercase tracking-widest">
              FOOD DELIVERY &amp; MORE
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Form Section */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 bg-white dark:bg-[#121620] rounded-t-[40px] -mt-10 relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] px-6 pt-8 pb-6 flex flex-col justify-between"
      >
        <div className="max-w-md mx-auto w-full flex flex-col h-full justify-between">
          <div>
            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />

            <div className="space-y-1 mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Get Started
              </h2>
              <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                Enter your mobile number to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className={`relative flex items-center bg-[#f4f4f5] dark:bg-gray-900 border-2 rounded-2xl transition-all duration-200 overflow-hidden shadow-sm ${
                  isValidPhone 
                    ? "border-[#659116] ring-4 ring-[#659116]/10" 
                    : error 
                    ? "border-red-500 ring-4 ring-red-500/10" 
                    : "border-[#659116] focus-within:ring-4 focus-within:ring-[#659116]/10"
                }`}>
                  <div className="flex items-center gap-1.5 px-4 py-4 bg-[#f4f4f5] dark:bg-gray-800 text-gray-900 dark:text-white font-black text-lg border-r border-[#659116]/30 flex-shrink-0 select-none">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>

                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Mobile Number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="flex-1 h-16 text-lg font-black text-gray-900 dark:text-white bg-transparent border-0 outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 tracking-wider px-4 placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:font-normal"
                  />

                  {isValidPhone && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="pr-4 text-[#659116]">
                      <ShieldCheck className="w-5 h-5 fill-[#659116]/20" />
                    </motion.div>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-500 pl-1 pt-0.5"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !isValidPhone}
                className={`w-full h-16 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 shadow-md ${
                  isValidPhone && !isLoading
                    ? "bg-[#659116] hover:bg-[#588114] text-white shadow-[0_8px_20px_rgba(101,145,22,0.35)] active:scale-[0.98] cursor-pointer"
                    : "bg-[#659116]/60 text-white/80 cursor-not-allowed shadow-none opacity-80"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <>
                    <span>CONTINUE</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <footer className="mt-8 text-center border-t border-gray-100 dark:border-gray-800/80 pt-4 space-y-1">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-wide uppercase">
              BY JOINING, YOU AGREE TO OUR POLICIES
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">
              <Link to="/food/user/profile/terms" className="hover:text-[#659116]">TERMS</Link> • <Link to="/food/user/profile/privacy" className="hover:text-[#659116]">PRIVACY</Link> • <Link to="/food/user/profile/help-content" className="hover:text-[#659116]">SUPPORT</Link>
            </p>
          </footer>
        </div>
      </motion.div>
    </AnimatedPage>
  )
}
