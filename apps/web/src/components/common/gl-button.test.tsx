import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlButton } from './gl-button';

describe('GlButton', () => {
  it('renders its children', () => {
    render(<GlButton>Click me</GlButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders leading content before children', () => {
    render(<GlButton leading={<span data-testid="icon" />}>Save</GlButton>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders trailing content after children', () => {
    render(<GlButton trailing={<span data-testid="arrow" />}>Next</GlButton>);
    expect(screen.getByTestId('arrow')).toBeInTheDocument();
  });

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<GlButton onClick={onClick}>Click</GlButton>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when the disabled prop is set', async () => {
    const onClick = vi.fn();
    render(
      <GlButton onClick={onClick} disabled>
        Click
      </GlButton>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies primary variant classes by default', () => {
    const { container } = render(<GlButton>Save</GlButton>);
    expect(container.firstChild).toHaveClass('bg-gl-primary/[0.16]', 'text-gl-primary');
  });

  it('applies secondary variant classes', () => {
    const { container } = render(<GlButton variant="secondary">Cancel</GlButton>);
    expect(container.firstChild).toHaveClass('bg-gl-text/[0.06]', 'text-gl-text');
  });

  it('applies ghost variant classes', () => {
    const { container } = render(<GlButton variant="ghost">Skip</GlButton>);
    expect(container.firstChild).toHaveClass('bg-transparent', 'text-gl-text-muted');
  });

  it('forwards additional HTML attributes', () => {
    render(
      <GlButton type="submit" data-testid="submit-btn">
        Submit
      </GlButton>,
    );
    expect(screen.getByTestId('submit-btn')).toHaveAttribute('type', 'submit');
  });
});
