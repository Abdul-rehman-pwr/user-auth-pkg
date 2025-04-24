import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import axios from 'axios';
import * as yup from 'yup';
import ReCAPTCHA from 'react-google-recaptcha';
import { buildValidationSchema } from './validationSchema';
import { defaultFormConfig } from './defaultFormConfig';

export interface FieldConfig {
  name: string;
  type: string;
  placeholder?: string;
  label?: string;
  isImage?: boolean;
  isFile?: boolean;
  options?: string[];
}

interface LoginFormProps {
  config?: FieldConfig[];
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  validationSchema?: yup.AnyObjectSchema;
  textFieldComponent?: React.ComponentType<any>;
  imageFieldComponent?: React.ComponentType<any>;
  buttonComponent?: React.ComponentType<{ isLoading: boolean; children?: React.ReactNode }>;
  selectFieldComponent?: React.ComponentType<any>;
  buttonText?: string;
  isLoadingText?: string;
  errorText?: string;
  axiosConfig: any;
  enableCaptcha?: boolean;
  captchaSiteKey?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  config,
  onSuccess,
  onError,
  validationSchema,
  textFieldComponent: TextFieldComponent,
  imageFieldComponent: ImageFieldComponent,
  buttonComponent: ButtonComponent,
  selectFieldComponent: SelectFieldComponent,
  buttonText = 'Submit',
  isLoadingText = 'Processing...',
  errorText = 'Something went wrong.',
  axiosConfig,
  enableCaptcha = false,
  captchaSiteKey = '',
}) => {
  const finalConfig = config && config.length > 0 ? config : defaultFormConfig;
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const captchaRef = useRef<ReCAPTCHA | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    getValues,
    setValue,
  } = useForm({
    resolver: yupResolver(validationSchema || buildValidationSchema(finalConfig)),
    mode: 'onChange',
  });

  useEffect(() => {
    finalConfig.forEach((field) => {
      if (field.isFile || field.isImage) {
        register(field.name);
      }
    });

    // Automatically set the accountTypeId to 1 or 2 before submission
    setValue('accountTypeId', 1); // or set to 2 depending on your logic
  }, [register, finalConfig, setValue]);

  const handleCaptchaChange = async (token: string | null) => {
    if (token) {
      setCaptchaToken(token);
      const formData = getValues();
      await doSubmit({ ...formData, captchaResponse: token });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue(fieldName, file, { shouldValidate: true });
    }
  };

  const doSubmit = async (formData: any) => {
    setIsLoading(true);
    setApiError('');

    try {
      const payload: Record<string, any> = {};
      finalConfig.forEach((field) => {
        let value = formData[field.name];
        if (field.type === 'number') value = value !== '' ? Number(value) : undefined;
        payload[field.name] = value;
      });

      if (enableCaptcha) {
        payload.captchaResponse = formData.captchaResponse || captchaToken;
      }

      const response = await axios({ ...axiosConfig, data: payload });
      onSuccess?.(response.data);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || errorText;
      setApiError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
      captchaRef.current?.reset();
      setShowCaptcha(false);
    }
  };

  const onSubmit = async (formData: any) => {
    enableCaptcha ? setShowCaptcha(true) : await doSubmit(formData);
  };

  const renderField = (field: FieldConfig, index: number) => {
    const fieldError = errors[field.name]?.message as string;
    const file = getValues(field.name);

    // Dropdown
    if (field.type === 'select' && field.options) {
      return SelectFieldComponent ? (
        <Controller
          name={field.name}
          control={control}
          defaultValue=""
          render={({ field: controllerField, fieldState }) => (
            <SelectFieldComponent
              label={field.label || field.placeholder}
              options={field.options}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              {...controllerField}
            />
          )}
        />
      ) : (
        <div key={index}>
          <label>{field.label}</label>
          <select {...register(field.name)} defaultValue="">
            <option value="">Select</option>
            {field.options.map((opt, idx) => (
              <option key={idx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {fieldError && <p style={{ color: 'red' }}>{fieldError}</p>}
        </div>
      );
    }

    // File/Image Field
    if (field.isFile || field.isImage) {
      return ImageFieldComponent ? (
        <ImageFieldComponent
          label={field.label}
          name={field.name}
          error={!!fieldError}
          helperText={fieldError}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleImageChange(e, field.name)
          }
          preview={field.isImage && file ? URL.createObjectURL(file) : undefined}
        />
      ) : (
        <div key={index}>
          <label>{field.label}</label>
          <input type="file" onChange={(e) => handleImageChange(e, field.name)} />
        </div>
      );
    }

    // Text/Email/Password
    return TextFieldComponent ? (
      <TextFieldComponent
        type={field.type}
        placeholder={field.placeholder}
        error={!!errors[field.name]}
        helperText={fieldError}
        {...register(field.name)}
        fullWidth
      />
    ) : (
      <div key={index}>
        <input type={field.type} placeholder={field.placeholder} {...register(field.name)} />
        {fieldError && <p style={{ color: 'red' }}>{fieldError}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Render fields in a dynamic layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {finalConfig.map((field, i) => (
          <div
            key={i}
            style={{
              marginBottom: 16,
              width:
                finalConfig.length === 1 // If only 1 field, take full width
                  ? '100%' 
                  : finalConfig.length === 2 // If 2 fields, each takes full width on separate lines
                  ? '100%' 
                  : '48%', // If 3 or more, use 48% (2 per row)
              boxSizing: 'border-box',
            }}
          >
            {/* Prevent 'accountTypeId' field from showing */}
            {field.name !== 'accountTypeId' && renderField(field, i)}
          </div>
        ))}
      </div>
  
      {showCaptcha && enableCaptcha && (
        <ReCAPTCHA sitekey={captchaSiteKey} ref={captchaRef} onChange={handleCaptchaChange} />
      )}
  
      {!showCaptcha && (
        ButtonComponent ? (
          <ButtonComponent isLoading={isLoading}>
            {isLoading ? isLoadingText : buttonText}
          </ButtonComponent>
        ) : (
          <button type="submit" disabled={isLoading}>
            {isLoading ? isLoadingText : buttonText}
          </button>
        )
      )}
  
      {apiError && <p style={{ color: 'red' }}>{apiError}</p>}
    </form>
  );
  
};

export default LoginForm;
