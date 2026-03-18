import { useForm } from 'react-hook-form';

export default function PaymentMethodForm({ paymentMethod, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: paymentMethod || {
      card_type: 'visa',
      last_four_digits: '',
      expiry_month: '',
      expiry_year: '',
      is_default: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={`form-group ${errors.card_type ? 'has-error' : ''}`}>
        <label htmlFor="card_type">Card type</label>
        <select id="card_type" {...register('card_type', { required: 'Card type is required' })}>
          <option value="visa">Visa</option>
          <option value="mastercard">Mastercard</option>
          <option value="amex">American Express</option>
          <option value="discover">Discover</option>
        </select>
        {errors.card_type && <span className="field-error">{errors.card_type.message}</span>}
      </div>

      <div className={`form-group ${errors.last_four_digits ? 'has-error' : ''}`}>
        <label htmlFor="last_four_digits">Last 4 digits</label>
        <input
          id="last_four_digits"
          placeholder="1234"
          maxLength={4}
          {...register('last_four_digits', {
            required: 'Last 4 digits are required',
            pattern: { value: /^\d{4}$/, message: 'Must be exactly 4 digits' },
          })}
        />
        {errors.last_four_digits && (
          <span className="field-error">{errors.last_four_digits.message}</span>
        )}
      </div>

      <div className="form-row">
        <div className={`form-group ${errors.expiry_month ? 'has-error' : ''}`}>
          <label htmlFor="expiry_month">Expiry month</label>
          <input
            id="expiry_month"
            type="number"
            min="1"
            max="12"
            placeholder="MM"
            {...register('expiry_month', {
              required: 'Required',
              min: { value: 1, message: 'Invalid month' },
              max: { value: 12, message: 'Invalid month' },
              valueAsNumber: true,
            })}
          />
          {errors.expiry_month && <span className="field-error">{errors.expiry_month.message}</span>}
        </div>

        <div className={`form-group ${errors.expiry_year ? 'has-error' : ''}`}>
          <label htmlFor="expiry_year">Expiry year</label>
          <input
            id="expiry_year"
            type="number"
            placeholder="YYYY"
            {...register('expiry_year', {
              required: 'Required',
              validate: (year) => {
                const now = new Date();
                const month = getValues('expiry_month');
                if (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
                  return 'Card expired';
                }
                return true;
              },
              valueAsNumber: true,
            })}
          />
          {errors.expiry_year && <span className="field-error">{errors.expiry_year.message}</span>}
        </div>
      </div>

      <div className="form-group checkbox">
        <label>
          <input type="checkbox" {...register('is_default')} />
          Set as default payment method
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : paymentMethod ? 'Save changes' : 'Add card'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
