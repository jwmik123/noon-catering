# Correctienota verkoopfacturen & creditnota's — april 2026

**Van:** NOON Sandwicherie & Koffie
**Betreft:** rechtzetting factuur- en creditnotanummers april 2026
**Bijlagen:** `boekhouding-april-2026.csv` (volledige reeks), `boekhouding-probleemgevallen-2026.csv`

Het bestelsysteem kende per ongeluk twee reeksen toe in hetzelfde formaat `2026-NNNN`:
het **ordernummer** (bij bestelling) én het **factuurnummer** (bij facturatie). Daardoor
zijn enkele facturen in de boekhouding onder het verkeerde nummer (= het ordernummer)
geboekt. **De facturen die de klanten ontvingen dragen wél telkens het juiste, unieke
factuurnummer.** Dit is dus een **herboeking/correctie**, geen heruitreiking — er moeten
geen nieuwe documenten naar de klanten.

De interne nummering is intussen gecorrigeerd: factuurnummers zijn uniek en creditnota's
hebben een **eigen reeks `CN-2026-NNNN`**.

---

## 1. Foutief geboekte verkoopfacturen → correct factuurnummer

Boek deze lijnen om naar het **correcte factuurnummer** (bedrag en klant blijven gelijk):

| Geboekt als | Correct factuurnummer | Klant | Bedrag | Opmerking |
|---|---|---|---|---|
| 2026-0040 | **2026-0055** | Milliken Europe BV | 106,89 | was ordernr; zie ook §2 (creditnota) |
| 2026-0040 (blijft) | 2026-0040 | KlimaatContact vzw | 74,53 | dit ís de echte factuur 0040 |
| 2026-0093 | **2026-0101** | Lenie Dhooghe | 88,38 | was ordernr 0093 |
| 2026-0093 (blijft) | 2026-0093 | BRP Europe NV | 169,19 | dit ís de echte factuur 0093 |
| 2026-0094 | **2026-0099** | Anke van de Vreede (Voice Four) | 138,70 | was ordernr 0087 |
| 2026-0087 (blijft) | 2026-0087 | Pinky Swear vzw | 73,19 | dit ís de echte factuur 0087 |
| 2026-0094 (blijft) | 2026-0094 | LEGALFLY | 213,71 | dit ís de echte factuur 0094 |
| 2026-0097 (ontbrak) | **2026-0097** | PANIAGO | 205,06 | factuur had wél nr 0097, boek dit nr in |

## 2. Creditnota's → eigen nummer (reeks CN-2026)

De geannuleerde facturen kregen een eigen creditnotanummer. Boek de creditnota onder het
**CN-nummer**, met verwijzing naar de oorspronkelijke factuur:

| Creditnota nr | Oorspr. factuur | Klant | Bedrag | Datum |
|---|---|---|---|---|
| **CN-2026-0001** | 2026-0028 | Milliken Europe BV | −273,47 | 10/04/2026 |
| **CN-2026-0002** | 2026-0055 | Milliken Europe BV | −106,89 | 10/04/2026 |
| **CN-2026-0003** | 2026-0091 | BRP Europe NV | −169,19 | 13/04/2026 |
| **CN-2026-0004** | 2026-0092 | BRP Europe NV | −77,38 | 13/04/2026 |
| **CN-2026-0005** | 2026-0081 | vdk bank | −23,31 | 21/04/2026 |
| **CN-2026-0006** | 2026-0120 | Maya van de Casteele | −112,79 | 28/04/2026 |
| **CN-2026-0007** | 2026-0144 | Museum Dr. Guislain | −1130,62 | 12/05/2026 |

> Eerdere "CREDITNOTA"-mails droegen nog het factuurnummer. Vervang dat door bovenstaand
> CN-nummer. De creditnota's 0120 (Maya) en 0144 (Museum) deelden voorheen hetzelfde nummer
> als hun factuur — dat is hiermee opgelost.

## 3. Ontbrekende factuurnummers 2026-0088 en 2026-0089

**Er bestaan geen facturen onder 2026-0088 en 2026-0089.** Deze twee nummers gaan terug op
twee **testbestellingen** van de ontwikkelaar (`joel@mikdevelopment.nl`) op 9 april 2026,
die nooit betaald of gefactureerd werden. Er is dus geen klant, geen omzet en geen BTW onder
deze nummers. Het gat in de reeks (…0087, 0090…) is hiermee verklaard en mag als zodanig
genoteerd worden.

---

*Vragen over deze correctie? Neem contact op via bestel@noonsandwicherie.be.*
