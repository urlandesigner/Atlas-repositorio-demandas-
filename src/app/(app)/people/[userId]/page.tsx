import { PersonPublicProfile } from "@/components/people/person-public-profile"

export default async function PersonPublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  return <PersonPublicProfile userId={userId} />
}
