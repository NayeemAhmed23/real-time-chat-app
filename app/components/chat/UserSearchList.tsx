import { UserDoc } from "./types";

type UserSearchListProps = {
  filteredUsers: UserDoc[] | undefined;
  onSelectUser: (clerkId: string) => Promise<void>;
};

export function UserSearchList({ filteredUsers, onSelectUser }: UserSearchListProps) {
  if (filteredUsers?.length === 0) {
    return <p className="text-gray-500 text-center mt-6">No users found</p>;
  }

  return (
    <>
      {filteredUsers?.map((user) => (
        <div
          key={user._id}
          onClick={() => onSelectUser(user.clerkId)}
          className="p-3 rounded flex items-center gap-3 cursor-pointer hover:bg-gray-100"
        >
          <div className="relative">
            <img src={user.image || ""} alt={user.name} className="w-8 h-8 rounded-full" />
            {user.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
          </div>

          <div>
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
      ))}
    </>
  );
}
