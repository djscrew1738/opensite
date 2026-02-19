import FixtureCard from './FixtureCard';
import { QUALIFYING_FIXTURES } from './constants';

export default function FixtureGrid({ fixtures, onChange }) {
  const handleFixtureChange = (key, value) => {
    onChange({ ...fixtures, [key]: value });
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {QUALIFYING_FIXTURES.map(fixture => (
        <FixtureCard
          key={fixture.key}
          fixture={fixture}
          count={fixtures[fixture.key] || 0}
          onChange={(val) => handleFixtureChange(fixture.key, val)}
        />
      ))}
    </div>
  );
}
