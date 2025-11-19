import { useState } from "react";
import { useWidgetState } from "../shared/use-widget-state";
import { initialPortfolioState } from "../shared/portfolio-types";
import "./portfolio-builder.css";

function PortfolioBuilder() {
  const [widgetState, setWidgetState] = useWidgetState(initialPortfolioState);

  // 로컬 에러 상태
  const [errors, setErrors] = useState({
    name: "",
    company: "",
  });

  // widgetState가 null인 경우 기본값 사용
  const profile = widgetState?.profile || { name: "", company: "" };

  // 입력 검증 함수
  const validateName = (value) => {
    if (!value.trim()) {
      return "이름을 입력해주세요";
    }
    if (value.trim().length < 2) {
      return "이름은 최소 2글자 이상이어야 합니다";
    }
    if (value.length > 50) {
      return "이름은 최대 50글자까지 입력 가능합니다";
    }
    return "";
  };

  const validateCompany = (value) => {
    if (value && value.length > 100) {
      return "회사명은 최대 100글자까지 입력 가능합니다";
    }
    return "";
  };

  // 이름 입력 핸들러
  const handleNameChange = (e) => {
    const value = e.target.value;
    const error = validateName(value);

    setErrors((prev) => ({ ...prev, name: error }));
    setWidgetState({
      ...widgetState,
      profile: { ...profile, name: value },
    });
  };

  // 회사명 입력 핸들러
  const handleCompanyChange = (e) => {
    const value = e.target.value;
    const error = validateCompany(value);

    setErrors((prev) => ({ ...prev, company: error }));
    setWidgetState({
      ...widgetState,
      profile: { ...profile, company: value },
    });
  };

  // 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();

    const nameError = validateName(profile.name);
    const companyError = validateCompany(profile.company);

    setErrors({
      name: nameError,
      company: companyError,
    });

    if (!nameError && !companyError) {
      // ChatGPT에 follow-up 메시지 전송
      if (window.openai?.sendFollowUpMessage) {
        window.openai.sendFollowUpMessage({
          prompt: `포트폴리오 생성: 이름 "${profile.name}"${
            profile.company ? `, 회사 "${profile.company}"` : ""
          }`,
        });
      }
    }
  };

  const isSubmitDisabled = !profile.name.trim() || !!errors.name || !!errors.company;

  return (
    <div className="portfolio-container">
      <h1>📝 포트폴리오 생성</h1>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="name-input">
            이름 <span className="required" aria-label="필수">*</span>
          </label>
          <input
            id="name-input"
            type="text"
            placeholder="이름을 입력하세요"
            value={profile.name}
            onChange={handleNameChange}
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            maxLength={50}
          />
          {errors.name && (
            <div id="name-error" className="error-message" role="alert">
              {errors.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="company-input">회사명 (선택)</label>
          <input
            id="company-input"
            type="text"
            placeholder="회사명을 입력하세요 (선택)"
            value={profile.company}
            onChange={handleCompanyChange}
            aria-invalid={!!errors.company}
            aria-describedby={errors.company ? "company-error" : undefined}
            maxLength={100}
          />
          {errors.company && (
            <div id="company-error" className="error-message" role="alert">
              {errors.company}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          aria-disabled={isSubmitDisabled}
        >
          생성하기
        </button>
      </form>
    </div>
  );
}

export default PortfolioBuilder;
