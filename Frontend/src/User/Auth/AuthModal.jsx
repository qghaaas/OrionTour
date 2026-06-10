import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import RegistrationForm from "./RegisterForm";
import VerifyCodeForm from "./VerifyCodeForm";
import SuccessMessage from "./SuccessMessage";
import closeBtn from "../../mainIMG/closeBtn.svg";
import "../../main.css";
import "./auth.css";

export default function AuthModal({ isOpen, onClose }) {
  const [step, setStep] = useState("login");
  const [registrationData, setRegistrationData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleForgotPassword = () => {
    alert("Функция восстановления пароля пока не реализована");
  };

  const handleClose = () => {
    setStep("login");
    setRegistrationData({
      email: "",
      password: "",
    });
    onClose();
  };

  const saveAuthData = (authData) => {
    if (!authData?.user || !authData?.token) return;

    localStorage.setItem("user", JSON.stringify(authData.user));
    localStorage.setItem("authToken", authData.token);
    window.dispatchEvent(new Event("authChanged"));
  };

  const handleLoginSuccess = (authData) => {
    saveAuthData(authData);
    setStep("success");
  };

  const handleRegistrationSuccess = (authData) => {
    saveAuthData(authData);
    setStep("success");
  };

  const handleCodeSent = ({ email, password }) => {
    setRegistrationData({ email, password });
    setStep("verify");
  };

  if (!isOpen) return null;

  return (
     <section className="auth-section" onClick={handleClose}>
        <div className="auth-inner" onClick={(e) => e.stopPropagation()}>
            <button className="closeBtn" type="button" onClick={handleClose}>
                <img src={closeBtn} alt="Закрыть" />
            </button>

            {step === "login" && (
                <LoginForm
                    onOpenRegistration={() => setStep("register")}
                    onForgotPassword={handleForgotPassword}
                    onSuccess={handleLoginSuccess}
                />
            )}

            {step === "register" && (
                <RegistrationForm
                    onOpenLogin={() => setStep("login")}
                    onCodeSent={handleCodeSent}
                />
            )}

            {step === "verify" && (
                <VerifyCodeForm
                    email={registrationData.email}
                    password={registrationData.password}
                    onBack={() => setStep("register")}
                    onSuccess={handleRegistrationSuccess}
                />
            )}

            {step === "success" && <SuccessMessage onClose={handleClose} />}
        </div>
    </section>
  );
}