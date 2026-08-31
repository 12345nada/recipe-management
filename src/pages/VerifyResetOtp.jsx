import { 
  useEffect, 
  useRef, 
  useState, 
} from "react"; 
 
import { 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
} from "lucide-react"; 
 
import { 
  useLocation, 
  useNavigate, 
} from "react-router-dom"; 
 
import { 
  supabase, 
} from "../lib/supabaseClient"; 
 
import Background from "../assets/images/Background2.png"; 
 
import "../styles/Login.css"; 
import "../styles/PasswordRecovery.css"; 
 
 
const OTP_LENGTH = 8; 
 
 
function VerifyResetOtp() { 
  const navigate = 
    useNavigate(); 
 
  const location = 
    useLocation(); 
 
  const email = 
    sessionStorage.getItem( 
      "passwordRecoveryEmail" 
    ) || ""; 
 
  const [ 
    digits, 
    setDigits, 
  ] = useState( 
    Array( 
      OTP_LENGTH 
    ).fill("") 
  ); 
 
  const [ 
    loading, 
    setLoading, 
  ] = useState(false); 
 
  const [ 
    resending, 
    setResending, 
  ] = useState(false); 
 
  const [ 
    errorMessage, 
    setErrorMessage, 
  ] = useState(""); 
 
  const [ 
    infoMessage, 
    setInfoMessage, 
  ] = useState( 
    location.state?.message || 
    "Enter the OTP sent to your email." 
  ); 
 
 
  const inputsRef = 
    useRef([]); 
 
 
  useEffect(() => { 
    if (!email) { 
      navigate( 
        "/forgot-password", 
        { 
          replace: 
            true, 
        } 
      ); 
    } 
  }, [ 
    email, 
    navigate, 
  ]); 
 
 
  const handleDigitChange = 
    ( 
      index, 
      value 
    ) => { 
      const cleanValue = 
        value 
          .replace( 
            /\D/g, 
            "" 
          ) 
          .slice( 
            -1 
          ); 
 
 
      const nextDigits = [ 
        ...digits, 
      ]; 
 
 
      nextDigits[ 
        index 
      ] = cleanValue; 
 
 
      setDigits( 
        nextDigits 
      ); 
 
 
      setErrorMessage( 
        "" 
      ); 
 
 
      if ( 
        cleanValue && 
        index < 
          OTP_LENGTH - 1 
      ) { 
        inputsRef.current[ 
          index + 1 
        ]?.focus(); 
      } 
    }; 
 
 
  const handleKeyDown = 
    ( 
      index, 
      event 
    ) => { 
      if ( 
        event.key === 
          "Backspace" && 
        !digits[index] && 
        index > 0 
      ) { 
        inputsRef.current[ 
          index - 1 
        ]?.focus(); 
      } 
    }; 
 
 
  const handlePaste = 
    ( 
      event 
    ) => { 
      const pasted = 
        event.clipboardData 
          .getData( 
            "text" 
          ) 
          .replace( 
            /\D/g, 
            "" 
          ) 
          .slice( 
            0, 
            OTP_LENGTH 
          ); 
 
 
      if (!pasted) { 
        return; 
      } 
 
 
      event.preventDefault(); 
 
 
      const nextDigits = 
        Array( 
          OTP_LENGTH 
        ).fill(""); 
 
 
      pasted 
        .split("") 
        .forEach( 
          ( 
            digit, 
            index 
          ) => { 
            nextDigits[ 
              index 
            ] = digit; 
          } 
        ); 
 
 
      setDigits( 
        nextDigits 
      ); 
 
 
      const focusIndex = 
        Math.min( 
          pasted.length, 
          OTP_LENGTH - 1 
        ); 
 
 
      inputsRef.current[ 
        focusIndex 
      ]?.focus(); 
    }; 
 
 
  const handleSubmit = 
    async ( 
      event 
    ) => { 
      event.preventDefault(); 
 
 
      const token = 
        digits.join( 
          "" 
        ); 
 
 
      if ( 
        token.length !== 
        OTP_LENGTH 
      ) { 
        setErrorMessage( 
          "Please enter the complete 8-digit OTP." 
        ); 
 
        return; 
      } 
 
 
      try { 
        setLoading( 
          true 
        ); 
 
        setErrorMessage( 
          "" 
        ); 
 
 
        const { 
          error, 
        } = 
          await supabase 
            .auth 
            .verifyOtp({ 
              email, 
              token, 
              type: 
                "recovery", 
            }); 
 
 
        if (error) { 
          throw error; 
        } 
 
 
        navigate( 
          "/reset-password", 
          { 
            replace: 
              true, 
          } 
        ); 
      } catch (error) { 
        console.error( 
          "Verify reset OTP error:", 
          error 
        ); 
 
 
        setErrorMessage( 
          error?.message || 
          "The OTP is incorrect or has expired." 
        ); 
      } finally { 
        setLoading( 
          false 
        ); 
      } 
    }; 
 
 
  const handleResend = 
    async () => { 
      try { 
        setResending( 
          true 
        ); 
 
        setErrorMessage( 
          "" 
        ); 
 
        setInfoMessage( 
          "" 
        ); 
 
 
        const { 
          error, 
        } = 
          await supabase 
            .auth 
            .resetPasswordForEmail( 
              email 
            ); 
 
 
        if (error) { 
          throw error; 
        } 
 
 
        setDigits( 
          Array( 
            OTP_LENGTH 
          ).fill("") 
        ); 
 
 
        setInfoMessage( 
          "A new OTP was sent to your email." 
        ); 
 
 
        inputsRef.current[ 
          0 
        ]?.focus(); 
      } catch (error) { 
        console.error( 
          "Resend OTP error:", 
          error 
        ); 
 
 
        setErrorMessage( 
          error?.message || 
          "Could not resend OTP." 
        ); 
      } finally { 
        setResending( 
          false 
        ); 
      } 
    }; 
 
 
  if (!email) { 
    return null; 
  } 
 
 
  return ( 
    <div className="login-page"> 
 
      <picture className="login-picture"> 
        <img 
          src={Background} 
          alt="Bites OTP verification background" 
          className="login-background" 
        /> 
      </picture> 
 
 
      <div className="login-content"> 
 
        <div className="login-card recovery-card"> 
 
          <div className="recovery-top-icon"> 
            <ShieldCheck 
              size={30} 
            /> 
          </div> 
 
 
          <h1> 
            Verify OTP 
          </h1> 
 
 
          <p className="login-subtitle recovery-subtitle"> 
            Enter the 8-digit OTP sent to 
            <strong className="recovery-email"> 
              {" "} 
              {email} 
            </strong> 
          </p> 
 
 
          {infoMessage && ( 
            <p className="recovery-info-message"> 
              {infoMessage} 
            </p> 
          )} 
 
 
          <form 
            onSubmit={ 
              handleSubmit 
            } 
          > 
 
            <div 
              className="otp-inputs" 
              onPaste={ 
                handlePaste 
              } 
            > 
              {digits.map( 
                ( 
                  digit, 
                  index 
                ) => ( 
                  <input 
                    key={index} 
                    ref={( 
                      element 
                    ) => { 
                      inputsRef.current[ 
                        index 
                      ] = element; 
                    }} 
                    type="text" 
                    inputMode="numeric" 
                    maxLength="1" 
                    value={digit} 
                    disabled={ 
                      loading || 
                      resending 
                    } 
                    onChange={( 
                      event 
                    ) => 
                      handleDigitChange( 
                        index, 
                        event.target.value 
                      ) 
                    } 
                    onKeyDown={( 
                      event 
                    ) => 
                      handleKeyDown( 
                        index, 
                        event 
                      ) 
                    } 
                    aria-label={`OTP digit ${index + 1}`} 
                  /> 
                ) 
              )} 
            </div> 
 
 
            {errorMessage && ( 
              <p 
                className="login-error-message recovery-error" 
                role="alert" 
              > 
                {errorMessage} 
              </p> 
            )} 
 
 
            <button 
              type="submit" 
              className="sign-in-btn recovery-primary-button" 
              disabled={ 
                loading || 
                resending 
              } 
            > 
              {loading 
                ? "Verifying..." 
                : "Verify OTP"} 
 
              {!loading && ( 
                <ArrowRight 
                  size={18} 
                /> 
              )} 
            </button> 
 
 
            <button 
              type="button" 
              className="recovery-resend-button" 
              onClick={ 
                handleResend 
              } 
              disabled={ 
                loading || 
                resending 
              } 
            > 
              {resending 
                ? "Sending..." 
                : "Resend OTP"} 
            </button> 
 
 
            <button 
              type="button" 
              className="recovery-back-link" 
              onClick={() => 
                navigate( 
                  "/forgot-password" 
                ) 
              } 
              disabled={ 
                loading || 
                resending 
              } 
            > 
              <ArrowLeft 
                size={17} 
              /> 
 
              Back 
            </button> 
 
          </form> 
 
        </div> 
 
      </div> 
 
    </div> 
  ); 
} 
export default VerifyResetOtp;