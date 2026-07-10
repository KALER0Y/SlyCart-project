import pytest

from core.exceptions import ShopLimitExceededError, UserAlreadyExistsError, InvalidRoleError
from core.services import create_user, create_shop
from core.models import TelegramUser, OwnerProfile, Shop
# Create your tests here.


@pytest.mark.django_db # Разрешение на то, чтобы обратится к базе данных. 
# Это дает временный доступ к базе данных, после теста данные удаляются
def test_services():

    create_user(telegram_id=12345, role="owner", brand_name="kapitoshka")

    assert TelegramUser.objects.count() == 1

    assert OwnerProfile.objects.filter(owner__user_id=12345).exists()
    profile = OwnerProfile.objects.get(owner__user_id=12345) # в этом случае join-ы(в QuerySet-ах) нельзя писать через точку, только через "__"!

    assert profile.tariff.plan == "Бесплатный"
    assert profile.brand_name == "kapitoshka"

@pytest.mark.django_db 
def test_create_user_with_incorrect_role():

    with pytest.raises(InvalidRoleError) as excinfo:
        create_user(telegram_id=777, role='hacker')

    assert str(excinfo.value) == "Такой роли не существует!"

@pytest.mark.django_db
def test_create_user_duplicate_id():

    create_user(telegram_id=999, role="customer", phone_number="89991234567")
    # Здесь нам нужен менеджер контекста, чтобы обработать ошибку и тест не завершился с ошибкой даже не начавшись
    with pytest.raises(UserAlreadyExistsError) as excinfo: # excinfo это целый объект-контейнер от pytest
        create_user(telegram_id=999, role="owner") 

    assert str(excinfo.value) == "Такой пользователь уже существует!"

@pytest.mark.django_db
def test_create_shop():

    user = create_user(telegram_id=123456, role="owner", brand_name="krols")

    own = OwnerProfile.objects.get(owner=user)


    create_shop(user=own, link="first_shop")
    assert Shop.objects.count() == 1

    with pytest.raises(ShopLimitExceededError) as excinfo:
        create_shop(user=own, link="second_shop")

    assert str(excinfo.value) == "Магазинов больше чем возможно"
    assert Shop.objects.count() == 1