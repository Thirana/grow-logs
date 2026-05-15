import { render, screen } from '@testing-library/react';
import { ScorePill } from './score-pill';

describe('ScorePill', () => {
  it('renders the score and label', () => {
    render(<ScorePill score={7} />);
    expect(screen.getByText(/7 \/ 10/)).toBeInTheDocument();
    expect(screen.getByText('score')).toBeInTheDocument();
  });

  it('applies primary (green) classes for score >= 8', () => {
    const { container } = render(<ScorePill score={8} />);
    expect(container.firstChild).toHaveClass('bg-gl-primary-soft', 'text-gl-primary');
  });

  it('applies primary (green) classes for score of 10', () => {
    const { container } = render(<ScorePill score={10} />);
    expect(container.firstChild).toHaveClass('bg-gl-primary-soft');
  });

  it('applies warning (yellow) classes for score >= 5 and < 8', () => {
    const { container } = render(<ScorePill score={5} />);
    expect(container.firstChild).toHaveClass('bg-gl-warning-soft', 'text-gl-warning');
  });

  it('applies warning classes for score of 7', () => {
    const { container } = render(<ScorePill score={7} />);
    expect(container.firstChild).toHaveClass('bg-gl-warning-soft');
  });

  it('applies danger (red) classes for score < 5', () => {
    const { container } = render(<ScorePill score={4} />);
    expect(container.firstChild).toHaveClass('bg-gl-danger-soft', 'text-gl-danger');
  });

  it('applies danger classes for score of 1', () => {
    const { container } = render(<ScorePill score={1} />);
    expect(container.firstChild).toHaveClass('bg-gl-danger-soft');
  });

  it('forwards the className prop', () => {
    const { container } = render(<ScorePill score={8} className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
