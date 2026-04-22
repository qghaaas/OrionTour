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
<<<<<<< HEAD
  const [step, setStep] = useState("login");
  const [registrationData, setRegistrationData] = useState(initialRegistrationData);
=======
    const [step, setStep] = useState("login");
    const [registrationData, setRegistrationData] = useState({
        email: "",
        password: "",
    });
>>>>>>> ccb94e64a2a5b67ff729f0f370f3df0ebd72e690

  const handleClose = () => {
    setStep("login");
    setRegistrationData(initialRegistrationData);
    onClose();
  };

<<<<<<< HEAD
  const handleCodeSent = (data) => {
    setRegistrationData(data);
    setStep("verify");
  };
=======
    const handleClose = () => {
        setStep("login");
        setRegistrationData({
            email: "",
            password: "",
        });
        onClose();
    };
>>>>>>> ccb94e64a2a5b67ff729f0f370f3df0ebd72e690

  if (!isOpen) return null;

<<<<<<< HEAD
  return (
    <section className="auth-section">
      <div className="container" onClick={handleClose}>
        <div className="auth-inner" onClick={(e) => e.stopPropagation()}>
          <button className="closeBtn" type="button" onClick={handleClose}>
            <img src={closeBtn} alt="Закрыть" />
          </button>
=======
    const handleCodeSent = ({ email, password }) => {
        setRegistrationData({ email, password });
        setStep("verify");
    };
>>>>>>> ccb94e64a2a5b67ff729f0f370f3df0ebd72e690

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

<<<<<<< HEAD
          {step === "success" && <SuccessMessage />}
        </div>
      </div>
    </section>
  );
=======
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
>>>>>>> ccb94e64a2a5b67ff729f0f370f3df0ebd72e690
}