import { useState } from "react";
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
        fullName: "",
        email: "",
        password: "",
    });

    const handleForgotPassword = () => {
        alert("Функция восстановления пароля пока не реализована");
    };

    const handleClose = () => {
        setStep("login");
        setRegistrationData({
            fullName: "",
            email: "",
            password: "",
        });
        onClose();
    };

    const handleLoginSuccess = (user) => {
        console.log("Пользователь вошёл:", user);
        setStep("success");
    };

    const handleCodeSent = ({ fullName, email, password }) => {
        setRegistrationData({ fullName, email, password });
        setStep("verify");
    };

    if (!isOpen) return null;

    return (
        <section className="auth-section">
            <div className="container" onClick={handleClose}>
                <div className="auth-inner" onClick={(e) => e.stopPropagation()}>
                    <button className="closeBtn" type="button" onClick={handleClose}>
                        <img src={closeBtn} alt="" />
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
                            fullName={registrationData.fullName}
                            email={registrationData.email}
                            password={registrationData.password}
                            onBack={() => setStep("register")}
                            onSuccess={() => setStep("success")}
                        />
                    )}

                    {step === "success" && (
                        <SuccessMessage onClose={handleClose} />
                    )}
                </div>
            </div>
        </section>
    );
}