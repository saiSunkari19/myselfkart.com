import { AccountContent } from "../../../components/storefront/account/account-content"
import { LoginForm } from "../../../components/storefront/account/login-form"
import type { AccountProps, LoginProps } from "../../../lib/themes/types"
import { EventpassFooter, EventpassNav, pageShell } from "./_live"

/** Eventpass login + account slots — shared auth/account UI in Eventpass chrome. */
export function EventpassLoginPage({ config, next, error, notice }: LoginProps) {
  return (
    <div style={pageShell()}>
      <EventpassNav config={config} hasDeals={false} categories={[]} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 20px" }}>
        <LoginForm next={next} error={error} notice={notice} accent={config?.accent_color ?? undefined} />
      </div>
      <EventpassFooter config={config} />
    </div>
  )
}

export function EventpassAccountPage(props: AccountProps) {
  const { config } = props
  return (
    <div style={pageShell()}>
      <EventpassNav config={config} hasDeals={false} categories={[]} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px" }}>
        <AccountContent {...props} accent={config?.accent_color ?? undefined} />
      </div>
      <EventpassFooter config={config} />
    </div>
  )
}
