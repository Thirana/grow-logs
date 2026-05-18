import { render, screen } from '@testing-library/react';
import { TypeBadge } from './type-badge';

describe('TypeBadge', () => {
  describe('WORK variant', () => {
    it('renders "Work" text for type WORK', () => {
      render(<TypeBadge type="WORK" />);
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('renders "Work" text for type Work (mixed case)', () => {
      render(<TypeBadge type="Work" />);
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('applies work color classes for WORK', () => {
      const { container } = render(<TypeBadge type="WORK" />);
      expect(container.firstChild).toHaveClass('bg-gl-work', 'text-gl-work-ink');
    });
  });

  describe('LEARNING variant', () => {
    it('renders "Learning" text for type LEARNING', () => {
      render(<TypeBadge type="LEARNING" />);
      expect(screen.getByText('Learning')).toBeInTheDocument();
    });

    it('renders "Learning" text for type Learning (mixed case)', () => {
      render(<TypeBadge type="Learning" />);
      expect(screen.getByText('Learning')).toBeInTheDocument();
    });

    it('applies learn color classes for LEARNING', () => {
      const { container } = render(<TypeBadge type="LEARNING" />);
      expect(container.firstChild).toHaveClass('bg-gl-learn', 'text-gl-learn-ink');
    });
  });

  it('forwards the className prop', () => {
    const { container } = render(<TypeBadge type="WORK" className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('renders the label text without a dot indicator', () => {
    const { container } = render(<TypeBadge type="WORK" />);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });
});
