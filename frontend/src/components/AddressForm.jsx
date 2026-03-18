import { useForm } from 'react-hook-form';

export default function AddressForm({ address, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: address || {
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      is_default: false,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className={`form-group ${errors.street ? 'has-error' : ''}`}>
        <label htmlFor="street">Street address</label>
        <input
          id="street"
          placeholder="123 Main St"
          {...register('street', { required: 'Street is required' })}
        />
        {errors.street && <span className="field-error">{errors.street.message}</span>}
      </div>

      <div className={`form-group ${errors.city ? 'has-error' : ''}`}>
        <label htmlFor="city">City</label>
        <input
          id="city"
          placeholder="San Francisco"
          {...register('city', { required: 'City is required' })}
        />
        {errors.city && <span className="field-error">{errors.city.message}</span>}
      </div>

      <div className="form-row">
        <div className={`form-group ${errors.state ? 'has-error' : ''}`}>
          <label htmlFor="state">State</label>
          <input
            id="state"
            placeholder="CA"
            {...register('state', { required: 'State is required' })}
          />
          {errors.state && <span className="field-error">{errors.state.message}</span>}
        </div>

        <div className={`form-group ${errors.postal_code ? 'has-error' : ''}`}>
          <label htmlFor="postal_code">Postal code</label>
          <input
            id="postal_code"
            placeholder="94105"
            {...register('postal_code', { required: 'Postal code is required' })}
          />
          {errors.postal_code && <span className="field-error">{errors.postal_code.message}</span>}
        </div>
      </div>

      <div className={`form-group ${errors.country ? 'has-error' : ''}`}>
        <label htmlFor="country">Country</label>
        <input
          id="country"
          placeholder="United States"
          {...register('country', { required: 'Country is required' })}
        />
        {errors.country && <span className="field-error">{errors.country.message}</span>}
      </div>

      <div className="form-group checkbox">
        <label>
          <input type="checkbox" {...register('is_default')} />
          Set as default address
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : address ? 'Save changes' : 'Add address'}
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
