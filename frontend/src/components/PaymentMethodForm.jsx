import { useForm } from 'react-hook-form';

export default function PaymentMethodForm({ paymentMethod, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
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
    <form onSubmit={handleSubmit(onSubmit)} className="payment-form">
      <div className="form-group">
        <label htmlFor="card_type">Card Type</label>
        <select id="card_type" {...register('card_type', { required: 'Card type is required' })}>
          <option value="visa">Visa</option>
          <option value="mastercard">Mastercard</option>
          <option value="amex">American Express</option>
          <option value="discover">Discover</option>
        </select>
        {errors.card_type && <span className="error">{errors.card_type.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="last_four_digits">Last 4 Digits</label>
        <input
          id="last_four_digits"
          maxLength={4}
          {...register('last_four_digits', {
            required: 'Last 4 digits are required',
            pattern: { value: /^\d{4}$/, message: 'Must be exactly 4 digits' },
          })}
        />
        {errors.last_four_digits && (
          <span className="error">{errors.last_four_digits.message}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="expiry_month">Expiry Month</label>
          <input
            id="expiry_month"
            type="number"
            min="1"
            max="12"
            {...register('expiry_month', {
              required: 'Required',
              min: { value: 1, message: 'Invalid' },
              max: { value: 12, message: 'Invalid' },
              valueAsNumber: true,
            })}
          />
          {errors.expiry_month && <span className="error">{errors.expiry_month.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="expiry_year">Expiry Year</label>
          <input
            id="expiry_year"
            type="number"
            min={new Date().getFullYear()}
            {...register('expiry_year', {
              required: 'Required',
              min: { value: new Date().getFullYear(), message: 'Card expired' },
              valueAsNumber: true,
            })}
          />
          {errors.expiry_year && <span className="error">{errors.expiry_year.message}</span>}
        </div>
      </div>

      <div className="form-group checkbox">
        <label>
          <input type="checkbox" {...register('is_default')} />
          Set as default
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
