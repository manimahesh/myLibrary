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
    <form onSubmit={handleSubmit(onSubmit)} className="address-form">
      <div className="form-group">
        <label htmlFor="street">Street</label>
        <input id="street" {...register('street', { required: 'Street is required' })} />
        {errors.street && <span className="error">{errors.street.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="city">City</label>
        <input id="city" {...register('city', { required: 'City is required' })} />
        {errors.city && <span className="error">{errors.city.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="state">State</label>
        <input id="state" {...register('state', { required: 'State is required' })} />
        {errors.state && <span className="error">{errors.state.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="postal_code">Postal Code</label>
        <input
          id="postal_code"
          {...register('postal_code', { required: 'Postal code is required' })}
        />
        {errors.postal_code && <span className="error">{errors.postal_code.message}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="country">Country</label>
        <input id="country" {...register('country', { required: 'Country is required' })} />
        {errors.country && <span className="error">{errors.country.message}</span>}
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
