import * as yup from 'yup';
import { FieldConfig } from './LoginForm';

export const buildValidationSchema = (config: FieldConfig[]) => {
  const schemaObj: Record<string, yup.AnySchema> = {};

  config.forEach((field) => {
    const message = field.placeholder || field.label || field.name;

    if (field.isFile || field.isImage) {
      let fileSchema = yup
        .mixed()
        .required(`${message} is required`)
        .test('fileExists', 'File is required', (value) => value instanceof File);

      if (field.isImage) {
        fileSchema = fileSchema.test(
          'fileType',
          'Only image files are allowed (jpg, png)',
          (value) =>
            value instanceof File && ['image/jpeg', 'image/png'].includes(value.type)
        );
      }

      schemaObj[field.name] = fileSchema;
    } else {
      let base = yup.string().required(`${message} is required`);
      if (field.type === 'email') base = base.email('Invalid email format');
      if (field.type === 'password') base = base.min(6, 'Password must be at least 6 characters');
      if (field.type === 'number') base = base.matches(/^\d+$/, 'Only numbers are allowed');
      schemaObj[field.name] = base;
    }
  });

  return yup.object().shape(schemaObj);
};
