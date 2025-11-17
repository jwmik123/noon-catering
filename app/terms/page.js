import React from "react";

export default function TermsPage() {
  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto">
      <div className="flex flex-col items-center justify-center">
        <div className="w-full mb-12">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary/90"
          >
            ← Terug naar Home
          </a>
        </div>
      </div>
      <h1 className="mb-8 text-3xl font-bold">Algemene Voorwaarden - NOON Sandwicherie & Koffie</h1>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Artikel 1 - Definities</h2>
        <p className="mb-4">
          NOON Sandwicherie: aanbieder van cateringdiensten. <br />
          Opdrachtgever: contractpartner van NOON Sandwicherie.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Artikel 2 - Toepasselijkheid</h2>
        <p className="mb-4">
          Deze algemene voorwaarden gelden voor alle aanbiedingen, offertes en overeenkomsten.
          Afwijkingen zijn enkel geldig indien schriftelijk overeengekomen.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Artikel 3 - Offertes en Bestellingen</h2>
        <p className="mb-4">
          Offertes zijn vrijblijvend en geldig gedurende 14 dagen, tenzij anders vermeld.
          Aanvaarding dient binnen deze termijn schriftelijk bevestigd te worden.
          <br />
          Cateringbestellingen moeten minstens twee werkdagen op voorhand schriftelijk bevestigd worden,
          met vermelding van het correcte aantal personen. Prijzen zijn gebaseerd op dit aantal,
          extra verbruik wordt nadien gefactureerd.
          <br />
          Indien geen bijgewerkt aantal wordt doorgegeven, wordt het laatst gekende aantal gebruikt.
          <br />
          NOON Sandwicherie behoudt zich het recht voor om bestellingen die niet minstens twee werkdagen
          op voorhand schriftelijk bevestigd zijn, te weigeren. Uiteraard staan we steeds open voor overleg.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Artikel 4 - Levering & Koeriersdiensten</h2>
        <p className="mb-4">
          NOON Sandwicherie is niet verantwoordelijk voor vertragingen veroorzaakt door externe leveringsdiensten.
          We streven ernaar alle bestellingen op het afgesproken tijdstip te leveren, maar kunnen dit niet garanderen.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Artikel 5 - Stiptheid</h2>
        <p className="mb-4">
          We vragen de opdrachtgever ervoor te zorgen dat afgesproken tijdstippen worden gerespecteerd
          zodat een vlotte uitvoering mogelijk is. Bij vertraging kan NOON Sandwicherie aangepaste service leveren,
          en eventuele meerkosten worden na overleg gefactureerd.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Artikel 6 - Betaling</h2>
        <p className="mb-4">
          Facturen dienen betaald te worden binnen 30 dagen na factuurdatum.
          Bij laattijdige betaling geldt een intrestvoet van 2% per maand op het totaalbedrag.
          <br />
          Voor bedragen vanaf €500 en hoger is een voorschot van 50% vereist bij bevestiging, elektronisch te betalen.
          Het resterende saldo dient na de dienstverlening betaald te worden, eveneens elektronisch.
          <br />
          Het niet nakomen van betalingsverplichtingen geeft NOON Sandwicherie het recht
          de overeenkomst te annuleren zonder schadevergoeding.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Artikel 7 - Annulering</h2>
        <p className="mb-4">
          Bij annulering worden volgende kosten aangerekend:
        </p>
        <ul className="list-disc list-inside mt-2 mb-4">
          <li>Binnen 24 uur voor levering: 50% van het totaalbedrag + €25 administratiekosten</li>
          <li>24 uur tot 3 dagen voor levering: 25% van het totaalbedrag + €25 administratiekosten</li>
          <li>Tot 3 dagen voor levering: €25 administratiekosten</li>
        </ul>
        <p className="mb-4">
          Annuleringen dienen per e-mail gemeld te worden, bij voorkeur voorafgegaan door een telefoongesprek.
          De datum van de e-mail geldt als officiële annuleringsdatum.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Artikel 8 - Wijziging Aantal Personen</h2>
        <p className="mb-4">
          Wijzigingen in het aantal personen moeten minstens 24 uur op voorhand schriftelijk worden doorgegeven,
          bij voorkeur voorafgegaan door een telefoongesprek. Wijzigingen binnen deze termijn kunnen niet meer
          verwerkt worden; het volledige bedrag blijft verschuldigd.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">Artikel 9 - Klachten</h2>
        <p className="mb-4">
          Klachten dienen schriftelijk gemeld te worden op de dag van levering.
          Aansprakelijkheid is beperkt tot het factuurbedrag.
        </p>
      </section>

    </div>
  );
}


