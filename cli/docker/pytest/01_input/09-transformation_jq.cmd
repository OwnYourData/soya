curl -k -s https://playground.data-container.net/PersonAinstance | soya transform PersonB --repo $REPO | soya validate PersonB --repo $REPO