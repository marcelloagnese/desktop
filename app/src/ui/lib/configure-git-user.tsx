import * as React from 'react'
import { Commit } from '../../models/commit'
import { lookupPreferredEmail } from '../../lib/email'
import {
  getGlobalConfigValue,
  setGlobalConfigValue,
} from '../../lib/git/config'
import { CommitListItem } from '../history/commit-list-item'
import { Account } from '../../models/account'
import { CommitIdentity } from '../../models/commit-identity'
import { Form } from '../lib/form'
import { Button } from '../lib/button'
import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'

interface IConfigureGitUserProps {
  /** The logged-in accounts. */
  readonly accounts: ReadonlyArray<Account>

  /** Called after the user has chosen to save their config. */
  readonly onSave?: () => void

  /** The label for the button which saves config changes. */
  readonly saveLabel?: string
}

interface IConfigureGitUserState {
  readonly globalUserName: string | null
  readonly globalUserEmail: string | null

  readonly name: string
  readonly email: string
  readonly avatarURL: string | null
}

/**
 * A component which allows the user to configure their Git user.
 *
 * Provide `children` elements which will be rendered below the form.
 */
export class ConfigureGitUser extends React.Component<
  IConfigureGitUserProps,
  IConfigureGitUserState
> {
  public constructor(props: IConfigureGitUserProps) {
    super(props)

    this.state = {
      globalUserName: null,
      globalUserEmail: null,
      name: '',
      email: '',
      avatarURL: null,
    }
  }

  public async componentWillMount() {
    const [globalUserName, globalUserEmail] = await Promise.all([
      getGlobalConfigValue('user.name'),
      getGlobalConfigValue('user.email'),
    ])

    this.setState(prevState => ({
      globalUserName,
      globalUserEmail,
      name: prevState.name.length === 0 ? globalUserName || '' : prevState.name,
      email:
        prevState.email.length === 0 ? globalUserEmail || '' : prevState.name,
    }))
  }

      }
    }
  }

  private dateWithMinuteOffset(date: Date, minuteOffset: number): Date {
    const copy = new Date(date.getTime())
    copy.setTime(copy.getTime() + minuteOffset * 60 * 1000)
    return copy
  }

  public render() {
    const now = new Date()

    // NB: We're using the name as the commit SHA:
    //  1. `Commit` is referentially transparent wrt the SHA. So in order to get
    //     it to update when we name changes, we need to change the SHA.
    //  2. We don't display the SHA so the user won't ever know our secret.
    const author = new CommitIdentity(
      this.state.name,
      this.state.email,
      this.dateWithMinuteOffset(now, -30)
    )
    const dummyCommit = new Commit(
      this.state.name,
      this.state.name.slice(0, 7),
      'Fix all the things',
      '',
      author,
      author,
      [],
      []
    )
    const emoji = new Map()
    return (
      <div id="configure-git-user">
        <Form className="sign-in-form" onSubmit={this.save}>
          <TextBox
            label="Name"
            placeholder="Your Name"
            value={this.state.name}
            onValueChanged={this.onNameChange}
          />

          <TextBox
            label="Email"
            placeholder="your-email@example.com"
            value={this.state.email}
            onValueChanged={this.onEmailChange}
          />

          <Row>
            <Button type="submit">{this.props.saveLabel || 'Save'}</Button>
            {this.props.children}
          </Row>
        </Form>

        <div id="commit-list" className="commit-list-example">
          <div className="header">Example commit</div>

          <CommitListItem
            commit={dummyCommit}
            emoji={emoji}
            gitHubUsers={null}
            gitHubRepository={null}
            isLocal={false}
          />
        </div>
      </div>
    )
  }

  private onNameChange = (name: string) => {
    this.setState({
      name,
    })
  }

  private onEmailChange = (email: string) => {
    const avatarURL = this.avatarURLForEmail(email)

    this.setState({
      name: this.state.name,
      email,
      avatarURL,
    })
  }

  private avatarURLForEmail(email: string): string | null {
    const matchingAccount = this.props.accounts.find(
      a => a.emails.findIndex(e => e.email === email) > -1
    )
    return matchingAccount ? matchingAccount.avatarURL : null
  }

  private save = async () => {
    if (this.props.onSave) {
      this.props.onSave()
    }

    const name = this.state.name
    if (name.length) {
      await setGlobalConfigValue('user.name', name)
    }

    const email = this.state.email
    if (email.length) {
      await setGlobalConfigValue('user.email', email)
    }
  }
}
