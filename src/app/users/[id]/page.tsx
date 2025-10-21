import { getUsersCollection, ObjectId } from "@/lib/mongo";

type PageProps = { params: { id: string } };

export default async function UserPage({ params }: PageProps) {
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(params.id);
  } catch {
    return <div>invalid id</div>;
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: objectId });
  if (!user) return <div className="center"><div className="container"><div className="card"><div className="title">User not found</div><a className="link" href="/">Back</a></div></div></div>;
  return (
    <div className="center">
      <div className="container">
        <div className="card">
          <h1 className="title">User</h1>
          <p className="subtitle">Here is the identifier and the name.</p>
          <div>
            <div className="muted">id</div>
            <div>{user._id.toHexString()}</div>
          </div>
          <div className="spacer" />
          <div>
            <div className="muted">name</div>
            <div>{user.name}</div>
          </div>
          <div className="spacer" />
          <a className="link" href="/">← Back</a>
        </div>
      </div>
    </div>
  );
}


