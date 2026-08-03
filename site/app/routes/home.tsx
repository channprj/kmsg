import { PageView } from "~/components/page-view"

export { meta } from "./page"

export default function HomeRoute() {
  return <PageView locale="ko" pageKey="home" />
}
