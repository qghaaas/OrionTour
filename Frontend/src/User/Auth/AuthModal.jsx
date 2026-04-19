import { useState } from "react";
import LoginForm from "./LoginForm";
import RegistrationForm from "./RegisterForm";
import VerifyCodeForm from "./VerifyCodeForm";
import SuccessMessage from "./SuccessMessage";
import closeBtn from '../../mainIMG/closeBtn.svg'
import '../../main.css'
import './auth.css'


export default function AuthModal({ isOpen, onClose }) {
    const [step, setStep] = useState("login");
    const [userEmail, setUserEmail] = useState("");

    if (!isOpen) return null;

    const handleClose = () => {
        setStep("login");
        onClose();
    };

    return (
        <section className="auth-section">
            <div className="container" onClick={handleClose}>
                <div className="auth-inner" onClick={(e) => e.stopPropagation()}>
                    <button className="closeBtn" type="button" onClick={handleClose}>
                        <img src={closeBtn} alt="" />
                    </button>
                    {step === "login" && (
                        <LoginForm
                            onOpenRegistration={() => setStep("registration")}
                            onForgotPassword={() => setStep("verify")}
                            onSuccess={() => setStep("success")}
                        />
                    )}
                    {step === "registration" && (
                        <RegistrationForm
                            onOpenLogin={() => setStep("login")}
                            onCodeSent={(email) => {
                                setUserEmail(email);
                                setStep("verify");
                            }}
                        />
                    )}
                    {step === "verify" && (
                        <VerifyCodeForm
                            email={userEmail}
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