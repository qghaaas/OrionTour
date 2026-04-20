import { useState } from "react";
import LoginForm from "./LoginForm";
import RegistrationForm from "./RegisterForm";
import VerifyCodeForm from "./VerifyCodeForm";
import SuccessMessage from "./SuccessMessage";
import closeBtn from "../../mainIMG/closeBtn.svg";
import "../../main.css";
import "./auth.css";

const initialRegistrationData = {
  email: "",
  password: "",
};

export default function AuthModal({ isOpen, onClose }) {
  const [step, setStep] = useState("login");
  const [registrationData, setRegistrationData] = useState(initialRegistrationData);

  const handleClose = () => {
    setStep("login");
    setRegistrationData(initialRegistrationData);
    onClose();
  };

  const handleCodeSent = (data) => {
    setRegistrationData(data);
    setStep("verify");
  };

  if (!isOpen) return null;

  return (
    <section className="auth-section">
      <div className="container" onClick={handleClose}>
        <div className="auth-inner" onClick={(e) => e.stopPropagation()}>
          <button className="closeBtn" type="button" onClick={handleClose}>
            <img src={closeBtn} alt="Закрыть" />
          </button>

          {step === "login" && (
            <LoginForm
              onOpenRegistration={() => setStep("register")}
              onSuccess={() => setStep("success")}
            />
          )}

          {step === "register" && (
            <RegistrationForm onCodeSent={handleCodeSent} />
          )}

          {step === "verify" && (
            <VerifyCodeForm
              email={registrationData.email}
              password={registrationData.password}
              onSuccess={() => setStep("success")}
            />
          )}

          {step === "success" && <SuccessMessage />}
        </div>
      </div>
    </section>
  );
}