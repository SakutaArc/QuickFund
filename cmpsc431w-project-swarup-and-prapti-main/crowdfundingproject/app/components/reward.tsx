import { useState, useEffect } from "react";
const Rewards = ({
  projectId,
  userDonations,
}: {
  projectId: number;
  userDonations: number;
}) => {
  const [rewards, setRewards] = useState<any[]>([]);

  const fetchRewards = async () => {
    const res = await fetch(`/api/rewards/${projectId}`);
    const data = await res.json();
    setRewards(data);
  };

  useEffect(() => {
    fetchRewards();
  }, [projectId]);

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Rewards</h2>

      {/* Rewards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <div
            key={reward.reward_id}
            className="bg-white border border-gray-300 rounded-lg shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-800">
              {reward.description}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Minimum donation: ${reward.min_donation}
            </p>

            {/* Progress towards reward */}
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Your Donation: ${userDonations}
              </p>
              <div className="h-2 bg-gray-200 rounded-full mt-2">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${(userDonations / reward.min_donation) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {userDonations >= reward.min_donation
                  ? "You qualify for this reward!"
                  : "Keep donating to unlock this reward."}
              </p>
            </div>

            {/* Show reward for project managers only */}
            {reward.is_manager && (
              <button
                className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                disabled={userDonations < reward.min_donation}
              >
                Claim Reward
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rewards;
