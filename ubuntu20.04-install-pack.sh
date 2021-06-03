#!/bin/sh
#Меняем владельца текущей папки с подпапками
cd ~/ubuntu20.04-install-pack
password=$(zenity --forms \
	--title="НАСТРОЙКА UBUNTU 20.04" \
  	--text="Введите пароль Администратора" \
    --add-password="Пароль"\
    --width=320)
echo $password | sudo -S chown -R $USER:$USER .
#sudo chown -R $USER:$USER .
#Даем права на запуск скриптов в каталоге install-pack/
sudo chmod +x install-pack.0/*
#read -sn1 -p "Press any key to continue...";echo
progs=$(zenity --width=800 --height=500 --list  --text "НАСТРОЙКА UBUNTU 20.04" --checklist --separator=" " \
			  --column "Выбрать" --column "Компоненты" --column "Описание" \
			   TRUE '0-upgrade' 'Обновление системы до последней актуальной версии'\
			   FALSE '1-full-upgrade' 'Переход на новую LTS версию системы'\
			   TRUE '1.1-chrome' 'Установка стабильной версии Chrome'\
			   FALSE '2-nvidia-driver' 'Установка драйвера видеокарты nvidia GeForce GTX 1650'\
			   TRUE '2.1-poweroff-button' 'Выключение компьютера с кнопки' \
			   FALSE '2.2-lightdm' 'Установка lightdm и настройка окна входа в систему'\
			   TRUE '2.3-switchkey' 'Переключение раскладки клавиатуры Ctrl+Shift'\
			   TRUE '2.4-i386' 'Поддержка i386 архитектуры'\
			   TRUE '2.5-hot-corner' 'Включаем активный угол меню Обзор'\
			   TRUE '2.6-templates' 'Шаблоны'\
			   TRUE '3-programs' 'Обязательные программы'\
			   TRUE '3.1-extensions' 'Ставим расширения рабочего стола'\
			   FALSE '3.2-tiling' 'Установка расширения Pop Shell Window Tiling'\
			   TRUE '3.3-codec' 'Установка кодеков для воспроизведения мультимедиа'\
			   TRUE '3.4-flash' 'Установка flash -плейера'\
			   TRUE '3.5-qt' 'QT приложения не будут отличаться от системной темы'\
			   TRUE '3.6-conky-clock' 'Ставим красивые часы и системный монитор на рабочий стол'\
			   TRUE '3.7-amule' 'Установка клиента P2P aMule'\
			   TRUE '3.8-office' 'Установка офисных программ'\
			   FALSE '4-zen-kernel' 'Установка Zen-ядра на Ubuntu 20.04'\
			   FALSE '1-brightness' 'Решение проблемы запоминания яркости Ubuntu '\
			   )
cd install-pack

count=$(echo $progs |wc -w)
clear
echo "ЧИСЛО УСТАНАВЛИВАЕМЫХ КОМПОНЕНТ: $count \n"
delta=$((100/$count + 1))

#(
procent=0 #Процент выполнения
for prog in $progs; do
	echo "Установка $prog ..."
	echo $procent #Выводим процент выполнения для zenity
	echo "#Установка $prog"
	echo "================================================================================================"
	./$prog 
 	sleep 1s
 	procent=$(( $procent + $delta ))
done
#)|
#zenity --progress \
#       --title="Конфигурирование. Устанавливаем $count компонент." \
#       --text="Инициализация..." \
#       --percentage=0 --width=600 --height=100\
#       --auto-close --auto-kill 
#
#if [ "$?" = -1 ]
#then
#  zenity --error --text="Изменение конфигурации отменено"
#fi

#Перезагружаемся в конце установки
echo "================================================================================================"
zenity --question --title="Перезагрузка системы" \
        --text="Установка успешно завершена. Для того чтоб изменения вступили в силу, необходимо перезагрузить компьютер. Перезагрузить компьютер сейчас?" \
        --timeout=20 --width=600 --height=100 
 if [ $? -eq "0" ]
 then
 	echo "ПЕРЕЗАГРУЗКА СИСТЕМЫ..."
	sudo reboot
 fi
