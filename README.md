# wedding-website

Prototype of Wedding Homepage for Ruben & Lena's Wedding.

This is an ec.dynamic-website with Angular.

**Built upon [visual-cms.website](https://github.com/entrecode/visual-cms.website), please refer to there for most documentation.**

## Features
- Login and RSVP for Invitation Codes
- Multiple Guests share 1 Invitation Code
- Guests can provide an email address
- Guests can log in with Invitation Code OR email address after they provided it
- Guests can RSVP for all guests of their invitation
- HTML Pages that are only visible tue logged in guests
- Spotify integration: allow guests to add music to a spotify playlist
- TBD: photo sharing

### Data Manager Structure

- Each card/code is a DM User (CODE@fakedomain.com)
- Code is the password for that user, not changeable
- Login via email is custom (password-less):
  - send email with token to email address
  - if token is clicked, load user, and login with code as password

Structure: 

- guest
  - properties:
    - name (text)
    - answer (number -1/0/1)
    - overnight (number -1/0/1)
    - preferences (text)
    - email (email)
    - isChild (boolean)
    - onlyCeremony (boolean)
    - onlyParty (boolean)
    - invitationCode (text ^[ABCDEFGHKLMNPQRSTUVWXYZ1-9]{3}$)
    - account (account)
  - policies:
    - registered users can get and put
    - entries where account is their accountID
    - put only on _modified, answer, overnight, preferences, email
- mail_token
  - properties:
    - recipient (email)
    - token (text)
    - account (account)
    - used (datetime)
  - mail hook
- spotify
  - single-entry model, just for storing spotify access token
  - properties:
    - access_token (text)
    - refresh_token (text)
    - expirateion (datetime)
- music
  - optional, just to additional store music wishes


### Config
- config/default.yml needs to be updated accordingly
- also, src/TypeAhead.vue needs the link to the spotify playlist updated