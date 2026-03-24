# [시스템 명세] 효과 엔진 및 데이터 스키마

## 1. 개요
- 카드의 기능을 원자 단위의 'Action'으로 분리한다.
- 복잡한 카드는 여러 개의 Action을 조합하여 구현한다. (예: 피해 + 취약 부여)

## 2. 핵심 구성 요소
- **Action (액션)**: 실제 수행되는 최소 단위 로직 (Damage, Block, Draw 등)
- **Effect Context (컨텍스트)**: 효과 실행 시 필요한 정보 (시전자, 대상, 현재 덱 상황 등)
- **Targeting (타겟팅)**: 효과가 적용될 대상 (단일 적, 전체 적, 자신 등)

## 3. 데이터 구조 정의 (Schema)
카드는 다음과 같은 속성을 포함하는 객체로 정의한다.

- **id**: 카드 고유 식별자 (String)
- **name**: 카드 이름 (String)
- **type**: ATTACK / SKILL / POWER / STATUS
- **cost**: 에너지 비용 (Int)
- **actions**: 아래 액션 객체들의 배열
    - **type**: 액션의 종류 (DAMAGE, BLOCK, BUFF 등)
    - **value**: 기본 수치
    - **target**: SELF, ENEMY_SINGLE, ENEMY_ALL
    - **statusId**: 버프/디버프 부여 시 사용 (예: "STRENGTH", "VULNERABLE")

## 4. 수치 계산 로직 (Value Calculation)
최종 수치는 다음 공식을 순차적으로 적용한다.
- **최종 수치 = (기본 수치 + 시전자 버프) * 시전자 시너지 계수 * 대상 피격 계수**
- 모든 계산은 정수 단위로 처리하며 소수점은 버림 처리한다.

## 5. 확장성 고려 사항
- 새로운 효과를 추가할 때 `Action` 클래스만 상속받아 구현하면 기존 카드 시스템에 즉시 통합 가능하다.