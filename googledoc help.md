Um den in deiner Anforderung erwähnten **Service Account Key** (`credentials.json`) zu erhalten, musst du die Google Cloud Console verwenden. Das ist im Grunde ein "Roboter-Ausweis", mit dem sich deine App gegenüber Google authentifiziert.

Hier ist der Schritt-für-Schritt-Prozess:

### 1. Google Cloud Projekt erstellen
Gehe zur [Google Cloud Console](https://console.cloud.google.com/).
* Falls du noch kein Projekt hast: Klicke oben links auf die Projektauswahl und dann auf **"Neues Projekt"**. Gib dem Projekt einen Namen (z.B. "Docs-Agent-Integration") und erstelle es.

### 2. Google Docs API aktivieren
Bevor der Key funktioniert, muss das Projekt wissen, dass es Google Docs nutzen darf.
* Gehe im Menü (links) auf **"APIs und Dienste"** > **"Bibliothek"**.
* Suche nach **"Google Docs API"**.
* Klicke darauf und dann auf den Button **"Aktivieren"**.

### 3. Service Account erstellen
Jetzt erstellen wir den "Bot-User".
* Gehe im Menü auf **"IAM & Verwaltung"** > **"Dienstkonten"** (Service Accounts).
* Klicke oben auf **"+ DIENSTKONTO ERSTELLEN"**.
* **Name:** Gib einen Namen ein (z.B. `docs-bot`).
* **ID:** Wird automatisch generiert.
* Klicke auf **"Erstellen und Fortfahren"**.
* (Optional) Rolle: Für einfache Docs-Bearbeitung kannst du diesen Schritt oft überspringen oder "Bearbeiter" (Editor) wählen, wenn der Bot Cloud-Ressourcen verwalten soll. Für den reinen Docs-Zugriff regeln wir das später über das Teilen des Dokuments.
* Klicke auf **"Fertig"**.



[Image of Google Cloud Service Account creation]


### 4. Den Key (credentials.json) generieren
* Du siehst nun dein neues Dienstkonto in der Liste. Klicke auf die **E-Mail-Adresse** dieses Kontos (sieht aus wie `docs-bot@dein-projekt.iam.gserviceaccount.com`).
* Gehe oben auf den Reiter **"KEYS"** (Schlüssel).
* Klicke auf **"SCHLÜSSEL HINZUFÜGEN"** > **"Neuen Schlüssel erstellen"**.
* Wähle als Typ **"JSON"**.
* Klicke auf **"Erstellen"**.

🎉 **Wichtig:** Jetzt wird automatisch eine `.json`-Datei auf deinen Computer heruntergeladen. Das ist dein Key! Benenne sie am besten in `credentials.json` um und lege sie in deinen Projektordner.

---

### 5. Der entscheidende Schritt: Zugriff gewähren
Das ist der Teil, der in deinem Text unter *"You will need to share the Google Docs with the Service Account email"* erwähnt wird und oft vergessen wird.

Der Service Account ist wie ein eigener Benutzer mit einer eigenen E-Mail-Adresse. Er sieht **nicht** automatisch deine privaten Dokumente.

1.  Öffne deine `credentials.json` (oder schaue in der Cloud Console) und kopiere die `client_email` (z.B. `docs-bot@dein-projekt.iam.gserviceaccount.com`).
2.  Gehe zu dem **Google Doc**, das dein Agent bearbeiten soll.
3.  Klicke oben rechts auf **"Freigeben"** (Share).
4.  Füge die **E-Mail-Adresse des Service Accounts** ein und gib ihm "Bearbeiter"-Rechte.
5.  Sende die Einladung ab (Häkchen bei "Benachrichtigen" kann raus, da Bots keine E-Mails lesen).



Jetzt hat dein Skript über die `credentials.json` Zugriff auf genau dieses Dokument.

---

> **⚠️ Sicherheits-Hinweis:** Lade die `credentials.json` **niemals** in ein öffentliches GitHub-Repository hoch (füge sie zu deiner `.gitignore` hinzu). Jeder, der diesen Key hat, kann im Namen dieses Bots agieren.

Möchtest du ein kurzes Code-Beispiel (Python oder Node.js), wie man die `credentials.json` dann im Code lädt, um ein Doc zu lesen?